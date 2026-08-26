-- Lime: bank statement pipeline, Stage A (schema, storage, upload capture)
--
-- Three tables:
--   bank_accounts            — metadata about an account the user told us about
--   bank_statement_imports   — one row per uploaded PDF and its processing status
--   bank_transactions        — one row per transaction, created empty in this
--                              stage; Stage B is what actually populates it
--
-- Nothing in this migration computes balances or categorizes anything — see
-- the column comments below for which stage fills each field in.

-- ---------------------------------------------------------------------------
-- bank_accounts
-- ---------------------------------------------------------------------------

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bank_name text not null,
  account_type text not null,        -- e.g. "Current Account", "Savings Account", "Wallet"
  account_number_masked text,        -- e.g. last 4 digits only — never store a full account number
  nickname text,                     -- optional user-friendly label, e.g. "Main salary account"
  currency text not null default 'PKR',
  created_at timestamptz not null default now()
);

alter table bank_accounts enable row level security;

create policy "Users can select their own bank accounts"
  on bank_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank accounts"
  on bank_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bank accounts"
  on bank_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bank accounts"
  on bank_accounts for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bank_statement_imports
-- ---------------------------------------------------------------------------

create table if not exists bank_statement_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references bank_accounts(id) on delete cascade,
  file_path text not null,           -- path within the bank-statements Storage bucket
  file_name text not null,           -- original filename, for display
  uploaded_at timestamptz not null default now(),
  period_start date,                 -- filled in during Stage B extraction; null until then
  period_end date,                   -- filled in during Stage B extraction; null until then
  has_running_balance boolean,       -- filled in during Stage B: does this statement report a
                                      -- balance after every transaction, or only totals?
  status text not null default 'uploaded'
    check (status in ('uploaded', 'processing', 'needs_review', 'completed', 'failed')),
  error_message text                 -- populated if status = 'failed'
);

alter table bank_statement_imports enable row level security;

create policy "Users can select their own statement imports"
  on bank_statement_imports for select
  using (auth.uid() = user_id);

-- Insert also confirms the target account actually belongs to this user, not
-- just that the new row is tagged with their own user_id — otherwise a user
-- could attach an upload to another user's account_id if they guessed it.
create policy "Users can insert their own statement imports"
  on bank_statement_imports for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from bank_accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "Users can update their own statement imports"
  on bank_statement_imports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own statement imports"
  on bank_statement_imports for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- bank_transactions (created empty in this stage — Stage B populates it)
-- ---------------------------------------------------------------------------

create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null references bank_accounts(id) on delete cascade,
  statement_import_id uuid not null references bank_statement_imports(id) on delete cascade,
  transaction_date date not null,
  description text not null,         -- raw "particulars" text as it appears on the statement
  instrument_number text,            -- cheque/instrument number, when present
  debit numeric,                     -- populated when this row is a debit; null otherwise
  credit numeric,                    -- populated when this row is a credit; null otherwise
  amount numeric generated always as (coalesce(credit, 0) - coalesce(debit, 0)) stored,
  balance_after numeric,             -- null until Stage B/C fills it in (see Stage C for the
                                      -- computed fallback when a statement has no running balance)
  balance_source text check (balance_source in ('stated', 'computed')),
  category text,                     -- see src/lib/bank/categories.ts; null until Stage B
                                      -- categorizes it. Constrained below to the same fixed list.
  reviewed boolean not null default false,
  fingerprint text not null,         -- dedup key, defined in Stage B — e.g. a hash of
                                      -- account_id + transaction_date + amount + description
  created_at timestamptz not null default now(),
  unique (account_id, fingerprint)
);

create index if not exists bank_transactions_account_date_idx on bank_transactions (account_id, transaction_date);
create index if not exists bank_transactions_import_idx on bank_transactions (statement_import_id);

-- Mirrors src/lib/bank/categories.ts exactly — keep both in sync.
alter table bank_transactions add constraint bank_transactions_category_check check (category in (
  'Salary / Payroll', 'Business Income', 'Dividends & Investment Returns', 'Other Income',
  'Personal Transfer', 'Business Transfer',
  'Cash Withdrawal', 'Cash Deposit',
  'Investments — Stocks / Mutual Funds', 'Fixed Deposit / Savings Instrument',
  'Credit Card Payment', 'Loan Repayment',
  'Rent / Housing Payment', 'Utilities & Bills',
  'Groceries', 'Dining & Cafes', 'Food Delivery', 'Shopping & Retail', 'Fuel',
  'Transport / Ride-hailing', 'Travel', 'Healthcare', 'Fitness & Sports', 'Education',
  'Entertainment', 'Subscriptions', 'Insurance', 'Zakat & Donations',
  'Bank Fees / Charges', 'Tax / Withholding',
  'Uncategorized'
));

alter table bank_transactions enable row level security;

create policy "Users can select their own transactions"
  on bank_transactions for select
  using (auth.uid() = user_id);

-- Same defense-in-depth as bank_statement_imports: confirm both the account
-- and the statement import actually belong to this user.
create policy "Users can insert their own transactions"
  on bank_transactions for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from bank_accounts a where a.id = account_id and a.user_id = auth.uid())
    and exists (select 1 from bank_statement_imports si where si.id = statement_import_id and si.user_id = auth.uid())
  );

create policy "Users can update their own transactions"
  on bank_transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on bank_transactions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for uploaded statement PDFs
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('bank-statements', 'bank-statements', false)
on conflict (id) do nothing;

-- Path convention: {user_id}/{statement_import_id}/{original_filename} — these
-- policies restrict access to rows whose first path segment is the caller's
-- own auth.uid(). storage.objects already has RLS enabled by Supabase.

create policy "Users can view their own bank statement files"
  on storage.objects for select
  using (bucket_id = 'bank-statements' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own bank statement files"
  on storage.objects for insert
  with check (bucket_id = 'bank-statements' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own bank statement files"
  on storage.objects for update
  using (bucket_id = 'bank-statements' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'bank-statements' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own bank statement files"
  on storage.objects for delete
  using (bucket_id = 'bank-statements' and (storage.foldername(name))[1] = auth.uid()::text);
