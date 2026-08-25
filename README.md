# Lime — AI Financial Advisor (Pakistan) Prototype

A UI/UX prototype for **Lime**, an AI-powered financial advisor for Pakistan. This is not a
functional product — every number, holding, and transaction shown is mocked/hardcoded. There are
no real integrations with any bank, brokerage, exchange, FBR, or Pakwheels. The goal is to
validate product direction in user interviews, so the build prioritizes realistic-looking mock
data and smooth navigation over backend logic.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Stack

- **Next.js (App Router)** + TypeScript
- **Tailwind CSS v4** for styling, with a custom yellow/black theme (`#FFD84D` / `#0A0A0A`)
- **Bowlby One** (headings) + **Plus Jakarta Sans** (body) via `next/font/google`
- **Recharts** for value-over-time and price charts
- **lucide-react** for icons
- All data lives in `src/lib/mock/*` — no backend, no database, no external API calls

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
- **Others** (`/others`) — manual asset entry with a mocked "AI document parsing" moment
  (upload or paste → "Reading your document..." → structured, editable fields)
- **Tax Filing** (`/tax`) — File Return (FBR Wealth Statement-style tally form), Filer Impact
  comparison, and Filing History tabs
- **Lime Assistant** — a persistent floating overlay, aware of the current screen and able to
  reference data across the whole app, with deep links into relevant screens

## Notes for reviewers

- Everything resets on a fresh `npm run dev` except assets added via the Others screen, which
  persist to `localStorage` for a smoother demo.
- No authentication, no real file uploads, no PDF generation — those are all UI-pattern mocks.
