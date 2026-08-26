# Lime — AI Financial Advisor (Pakistan) Prototype

A UI/UX prototype for **Lime**, an AI-powered financial advisor for Pakistan. Almost every number,
holding, and transaction shown is mocked/hardcoded — there are no real integrations with any bank,
brokerage, exchange, FBR, or Pakwheels, and `src/lib/mock/*` is the only "database" behind any
screen. The one exception on the reasoning layer: Lime's three AI surfaces (the global assistant,
the Stocks/Crypto research assistant, and the "Others" document-parsing flow) call a real LLM via
OpenRouter, using tool calling to read from that same mock data rather than having it stuffed into
the prompt.

> This app adds real Supabase-backed auth (email + password) and a handful of database tables — see
> [Auth &amp; database](#auth--database) and [Bank statement pipeline](#bank-statement-pipeline-stage-a)
> below. The app requires signing in to use at all. Every screen except the bank statement upload
> flow described below still reads from `src/lib/mock/*` — which now starts empty rather than
> pre-populated with fake numbers. Wiring more of the app to real data is ongoing, one piece at a time.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in the env vars below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it. On this branch you'll land on
`/login` first — see below.

## AI features (requires `OPENROUTER_API_KEY`)

Lime's three AI-labeled surfaces call OpenRouter server-side:

- The floating **Lime Assistant** overlay (`/api/assistant`) — screen-aware, cross-screen
  synthesis via tool calls into the mock data, and navigation suggestions.
- The **Research Assistant** embedded in the Stocks/Crypto Research tabs (`/api/research-assistant`)
  — scoped to market/sector research, with its own smaller tool set.
- The **"Others" asset parser** (`/api/parse-asset`) — reads pasted/typed asset terms and extracts
  structured fields via a forced tool call.

All three are fixed to a single model, `deepseek/deepseek-v4-flash-0731`, defined once in
`src/lib/ai/openrouter.ts` — it's not configurable via environment variable.

Set `OPENROUTER_API_KEY` (get one at [openrouter.ai](https://openrouter.ai)) in `.env.local` for
local development, or as a Project → Settings → Environment Variable in Vercel for the deployed
app. **Without it set, the three chat UIs show a clear inline "AI not configured" error** instead
of crashing — the rest of the app works normally either way.

## Auth &amp; database

The app requires signing in — every route redirects a signed-out visitor to `/login` via
`src/middleware.ts`. Auth is **Supabase email + password** (`signUp` / `signInWithPassword`), no
OAuth. Deliberately simplified for a prototype: **email confirmation is disabled** on the Supabase
side (Authentication → Sign In / Providers → Email → turn off "Confirm email"), so `signUp()`
returns an active session immediately — no email round-trip, no magic link, no rate limits to fight.

Required env vars (see `.env.example`), from your Supabase project's Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose to the browser;
  access is restricted by Row Level Security (RLS), not by secrecy.

You'll also need to apply the migrations in `supabase/migrations/` (via the Supabase dashboard's
SQL editor, or `supabase db push`) before signing in will fully work — this repo's tooling doesn't
provision or migrate your Supabase project for you.

The first migration creates `net_worth_snapshots` — a long/narrow record of
`(user_id, month, category, value)`, RLS-scoped to `auth.uid() = user_id`, with liability
categories (`loans`, `credit_cards`, `bnpl`) stored as negative values so a month's net worth is
always just `sum(value)`. It starts **empty** for every account — there is no seeding step, so a
new sign-up has zero rows rather than generated history.

**Nothing in the UI reads from this table yet** — every screen except the bank statement upload
flow below still reads from `src/lib/mock/*` (which now starts empty too — there's no real
bank/brokerage/FBR integration behind any of it). Wiring more screens to real data, and swapping
`net_worth_snapshots`'s `bank` category over to the pipeline below, are future passes.

## Bank statement pipeline (Stage A)

The second migration (`supabase/migrations/20260826120000_bank_statements.sql`) adds the first
piece of a real bank statement pipeline — **schema, file storage, and upload capture only**. It
does not read a PDF's contents yet:

- **`bank_accounts`** — metadata about an account the user has told the app about (bank, account
  type, optional nickname/masked account number).
- **`bank_statement_imports`** — one row per uploaded PDF: which account, filename, upload time,
  and a `status` (`uploaded` / `processing` / `needs_review` / `completed` / `failed`) that stays
  at `uploaded` for now, since nothing yet moves it further.
- **`bank_transactions`** — one row per transaction, linked to its account and import. Created
  empty; no code path in this stage writes to it. The fixed category list it will eventually use
  lives in `src/lib/bank/categories.ts`, mirrored exactly by a `check` constraint on the table.

All three follow the same per-user RLS pattern as `net_worth_snapshots` (explicit
select/insert/update/delete policies checking `auth.uid() = user_id`), plus an extra check on
insert that `account_id` (and, for transactions, `statement_import_id`) actually belongs to the
signed-in user.

Uploaded PDFs go to a **private Supabase Storage bucket, `bank-statements`** (created by the same
migration via `insert into storage.buckets ...` — nothing to set up separately), at
`{user_id}/{statement_import_id}/{original_filename}`, with Storage RLS policies restricting
access to whichever user's ID is the first path segment. The upload UI also enforces PDF-only and
a 15MB size cap client-side.

Try it at **Bank → Statements** (`/bank/statements`): add an account, upload a PDF, and see it
listed with its status. That's the entire surface of this stage — there's no "process this
statement" action, because nothing on the other end of it exists yet. Extracting transactions from
the PDF, categorizing them, and computing balances are future stages.

## Stack

- **Next.js (App Router)** + TypeScript, Route Handlers for the AI/auth endpoints (Node.js runtime)
- **Tailwind CSS v4** for styling, with a custom yellow/black theme (`#FFD84D` / `#0A0A0A`)
- **Bowlby One** (headings) + **Plus Jakarta Sans** (body) via `next/font/google`
- **Recharts** for value-over-time and price charts
- **lucide-react** for icons
- **OpenRouter** (OpenAI-compatible `chat/completions`, tool calling) for the AI surfaces above
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) for email/password auth and the one
  `net_worth_snapshots` table described above — this branch only
- All financial data shown in the app lives in `src/lib/mock/*` — no backend, no other external calls

## What's built

- **Net Worth Overview** (`/`) — sticky-column, horizontally scrollable category × month table,
  plus a bank accounts (`/bank`) and liabilities (`/liabilities`) drill-down
- **Stocks** (`/stocks`) — Portfolio, Watchlist, Market, Research (with an embedded research
  assistant), and Account Statement tabs, plus per-ticker detail pages
- **Crypto** (`/crypto`) — mirrors the Stocks structure, with a mock exchange source tag and
  transfers in the account statement
- **Mutual Funds** (`/mutual-funds`) — My Holdings / Explore Funds toggle, plus fund detail pages
- **Property / Vehicle / Gold** — shared list + detail pattern, valuations derived from mocked
  FBR per-sq-ft rates, Pakwheels-style resale data, and Sarafa Bazaar gold rates
- **Others** (`/others`) — manual asset entry with a real AI document-structuring moment (upload
  or paste → "Reading your document..." → LLM-extracted, editable fields)
- **Tax Filing** (`/tax`) — File Return (FBR Wealth Statement-style tally form), Filer Impact
  comparison, and Filing History tabs
- **Lime Assistant** — a persistent floating overlay, aware of the current screen and able to
  reference data across the whole app via tool calls, with deep links into relevant screens

## Notes for reviewers

- Everything resets on a fresh `npm run dev` except assets added via the Others screen, which
  persist to `localStorage` for a smoother demo, and (on this branch) the seeded
  `net_worth_snapshots` row for a given user, which persists in Supabase across sessions.
- No real file storage/OCR, no PDF generation — the "Others" upload path still simulates picking a
  file (there's no real upload pipeline), but the extracted result comes from a real model call,
  not a hardcoded template.
- Never commit a real API key or service-role key. `.env.local` is covered by `.gitignore`; only
  `.env.example` (with empty values) is checked in.
