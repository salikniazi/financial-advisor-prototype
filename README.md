# Lime — AI Financial Advisor (Pakistan) Prototype

A UI/UX prototype for **Lime**, an AI-powered financial advisor for Pakistan. Almost every number,
holding, and transaction shown is mocked/hardcoded — there are no real integrations with any bank,
brokerage, exchange, FBR, or Pakwheels, and `src/lib/mock/*` is the only "database" the app has.
The one exception is the reasoning layer: Lime's three AI surfaces (the global assistant, the
Stocks/Crypto research assistant, and the "Others" document-parsing flow) call a real LLM via
OpenRouter, using tool calling to read from that same mock data rather than having it stuffed into
the prompt.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in OPENROUTER_API_KEY, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

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

## Stack

- **Next.js (App Router)** + TypeScript, Route Handlers for the AI endpoints (Node.js runtime)
- **Tailwind CSS v4** for styling, with a custom yellow/black theme (`#FFD84D` / `#0A0A0A`)
- **Bowlby One** (headings) + **Plus Jakarta Sans** (body) via `next/font/google`
- **Recharts** for value-over-time and price charts
- **lucide-react** for icons
- **OpenRouter** (OpenAI-compatible `chat/completions`, tool calling) for the AI surfaces above
- All financial data lives in `src/lib/mock/*` — no backend, no database, no other external calls

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
  persist to `localStorage` for a smoother demo.
- No authentication, no real file storage/OCR, no PDF generation — the "Others" upload path still
  simulates picking a file (there's no real upload pipeline), but the extracted result comes from
  a real model call, not a hardcoded template.
- Never commit a real API key. `.env.local` is covered by `.gitignore`; only `.env.example` (with
  an empty value) is checked in.
