-- Lime: net_worth_snapshots
--
-- One row per user, per month, per category — a long/narrow record of what
-- each asset/liability category was worth in a given month. New categories
-- in future passes are new rows, never a schema change.
--
-- Liability categories (loans, credit_cards, bnpl) are stored as NEGATIVE
-- values, so "net worth for a user+month" is always just sum(value) with no
-- special-casing between assets and liabilities.

create table if not exists net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,           -- always the first of the month, e.g. 2026-08-01
  category text not null check (category in (
    'bank', 'stocks', 'mutual_funds', 'property', 'vehicle', 'crypto', 'gold', 'others',
    'loans', 'credit_cards', 'bnpl'
  )),
  value numeric not null,        -- negative for liability categories (loans, credit_cards, bnpl)
  created_at timestamptz not null default now(),
  unique (user_id, category, month)
);

create index if not exists net_worth_snapshots_user_category_month_idx
  on net_worth_snapshots (user_id, category, month);

alter table net_worth_snapshots enable row level security;

-- Four explicit policies, each scoped to auth.uid() = user_id — no single
-- permissive "for all" policy.

create policy "Users can select their own net worth snapshots"
  on net_worth_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own net worth snapshots"
  on net_worth_snapshots for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own net worth snapshots"
  on net_worth_snapshots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own net worth snapshots"
  on net_worth_snapshots for delete
  using (auth.uid() = user_id);
