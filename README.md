# Lime — AI Financial Advisor (Pakistan) Prototype

A UI/UX prototype for **Lime**, an AI-powered financial advisor for Pakistan. Almost every number,
holding, and transaction shown is mocked/hardcoded — there are no real integrations with any bank,
brokerage, exchange, FBR, or Pakwheels, and `src/lib/mock/*` is the only "database" behind any
screen. The one exception on the reasoning layer: Lime's three AI surfaces (the global assistant,
the Stocks/Crypto research assistant, and the "Others" document-parsing flow) call a real LLM via
OpenRouter, using tool calling to read from that same mock data rather than having it stuffed into
the prompt.

> **This branch (`feature/supabase-auth`) also adds real Supabase-backed auth (magic link) and one
> database table**, `net_worth_snapshots` — see [Auth &amp; database](#auth--database-this-branch)
> below. `main` stays exactly as it was: no sign-in required, no database. This branch requires
> signing in to use the app at all; nothing in the UI reads from Supabase yet beyond the one seeded
> table (verify it via the Supabase dashboard, not through any screen) — every screen still reads
> from `src/lib/mock/*` exactly as before. Individual holdings tables and wiring screens to real
> data are future work, one category at a time.

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

## Auth &amp; database (this branch)

This branch requires signing in — every route redirects a signed-out visitor to `/login` via
`src/middleware.ts`. Auth is **magic link only** (Supabase's passwordless OTP-via-email), no
password, no OAuth.

Required env vars (see `.env.example`), from your Supabase project's Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose to the browser;
  access is restricted by Row Level Security (RLS), not by secrecy.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used solely by the one-time per-user seed
  (`src/app/api/seed/route.ts`) to bypass RLS. Never exposed to the client.

You'll also need to apply the one migration in `supabase/migrations/` (via the Supabase dashboard's
SQL editor, or `supabase db push`) before signing in will fully work — this repo's tooling doesn't
provision or migrate your Supabase project for you.

That migration creates exactly **one table**, `net_worth_snapshots` — a long/narrow record of
`(user_id, month, category, value)`, RLS-scoped to `auth.uid() = user_id`, with liability
categories (`loans`, `credit_cards`, `bnpl`) stored as negative values so a month's net worth is
always just `sum(value)`. On a user's first-ever sign-in, `src/app/auth/callback/route.ts` seeds
this table from `assetRows`/`liabilityRows`' 12-month histories in `src/lib/mock/netWorth.ts` —
idempotent, never reseeds or duplicates on later sign-ins.

**Nothing in the UI reads from this table yet** — every screen still reads from `src/lib/mock/*`
exactly as it did before this branch existed. Verify the seeded data via the Supabase dashboard's
table editor, not through the app. Individual-category tables (stocks, crypto, property, etc.) and
wiring any screen to real data are future passes, one category at a time.

## Stack

- **Next.js (App Router)** + TypeScript, Route Handlers for the AI/auth endpoints (Node.js runtime)
- **Tailwind CSS v4** for styling, with a custom yellow/black theme (`#FFD84D` / `#0A0A0A`)
- **Bowlby One** (headings) + **Plus Jakarta Sans** (body) via `next/font/google`
- **Recharts** for value-over-time and price charts
- **lucide-react** for icons
- **OpenRouter** (OpenAI-compatible `chat/completions`, tool calling) for the AI surfaces above
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) for magic-link auth and the one
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
