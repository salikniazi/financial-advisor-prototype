import { NextRequest, NextResponse } from "next/server";
import { runToolLoop, ChatMessage } from "@/lib/ai/openrouter";
import { limeAssistantToolDefs, suggestNavigationToolDef, buildLimeAssistantExecutors, VALID_ROUTES } from "@/lib/ai/tools/limeAssistantTools";

export const runtime = "nodejs";

type RequestBody = {
  message: string;
  pathname: string;
  history?: { role: "user" | "assistant"; content: string }[];
};

const SCREEN_DESCRIPTIONS: Record<string, string> = {
  "/": "the Net Worth Overview — a month-by-month table of every asset and liability category and the total net worth.",
  "/bank": "the Bank Accounts detail screen.",
  "/liabilities": "the Liabilities screen (loans, credit cards, BNPL).",
  "/stocks": "the Stocks Portfolio tab.",
  "/stocks/watchlist": "the Stocks Watchlist tab.",
  "/stocks/market": "the Stocks Market tab (movers, sector performance).",
  "/stocks/research": "the Stocks Research tab.",
  "/stocks/statement": "the Stocks Account Statement tab.",
  "/crypto": "the Crypto Portfolio tab.",
  "/crypto/watchlist": "the Crypto Watchlist tab.",
  "/crypto/market": "the Crypto Market tab.",
  "/crypto/research": "the Crypto Research tab.",
  "/crypto/statement": "the Crypto Account Statement tab.",
  "/mutual-funds": "the Mutual Funds My Holdings tab.",
  "/mutual-funds/explore": "the Mutual Funds Explore Funds tab.",
  "/property": "the Property screen.",
  "/vehicle": "the Vehicle screen.",
  "/gold": "the Gold screen.",
  "/others": "the Others (manually added assets) screen.",
  "/tax": "the Tax Filing File Return tab (the FBR Wealth Statement-style tally form).",
  "/tax/filer-impact": "the Tax Filing Filer Impact comparison.",
  "/tax/filing-history": "the Tax Filing Filing History tab.",
};

function screenDescription(pathname: string): string {
  if (SCREEN_DESCRIPTIONS[pathname]) return SCREEN_DESCRIPTIONS[pathname];
  if (pathname.startsWith("/stocks/")) return "an individual stock detail screen.";
  if (pathname.startsWith("/crypto/")) return "an individual coin detail screen.";
  if (pathname.startsWith("/mutual-funds/")) return "an individual mutual fund detail screen.";
  if (pathname.startsWith("/property/")) return "an individual property detail screen.";
  if (pathname.startsWith("/vehicle/")) return "an individual vehicle detail screen.";
  if (pathname.startsWith("/gold/")) return "an individual gold item detail screen.";
  return "a screen in the Lime app.";
}

function buildSystemPrompt(pathname: string): string {
  return `You are the Lime Assistant, a persistent, app-wide AI advisor inside Lime — an AI financial advisor app for users in Pakistan. You are summonable from any screen as a floating overlay.

The user is currently looking at: ${screenDescription(pathname)} (route: ${pathname})

You have three jobs:
1. Explain what's on the current screen when asked, using the current route as context.
2. Cross-screen synthesis: answer questions that require pulling data from anywhere in the app (idle cash, sector exposure, filer savings, etc.) regardless of which screen the user is on. ALWAYS call the relevant tool(s) to fetch real numbers — never guess, estimate, or invent a figure. If a question needs several pieces of data (e.g. "am I overexposed to any sector"), call multiple tools and reason over the combined results yourself (e.g. sum stock values by sector and compute percentages) rather than assuming a number.
3. Navigation: when it would help, call suggest_navigation to offer a clickable link into a relevant screen. Only ever use one of the app's real routes — never invent a URL.

Tone and advisory pattern — follow this strictly:
- Structure observations as: Observation → Gentle nudge → Offered action. Example: "Your portfolio is 70% tech stocks. It may be worth looking into diversification — want to see analysts' top picks for 2026?"
- You are comfortable naming a financial pattern (concentration, idle cash, high spending in a category) and proposing a *category* of action. You must NEVER give a specific buy/sell instruction on a named security or coin (e.g. never say "sell your OGDC shares" or "buy more BTC").
- On tax, cash-flow, and filer-status matters you should be directive and quantified, because these are factual optimizations, not investment advice — e.g. "You should file as a filer — it would save you approximately Rs X this year." Use get_filer_impact for the real number.
- On anything touching security/asset allocation, stay informative and suggestive rather than prescriptive.
- Be concise — this is a small chat panel, not a report. A few sentences, not paragraphs.
- All currency is PKR (Rs). Use the Pakistani lakh/crore-friendly phrasing casually where natural (e.g. "Rs 4.5 lakh") but plain numbers are fine too.

You are distinct from the separate Research Assistant embedded in the Stocks/Crypto Research tabs — that one handles market research only. You handle navigation, on-screen explanation, and whole-account synthesis.`;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const pathname = body.pathname || "/";
  const history = Array.isArray(body.history) ? body.history : [];

  const actions: { label: string; href: string }[] = [];
  const executors = {
    ...buildLimeAssistantExecutors(),
    suggest_navigation: (args: { label?: string; href?: string }) => {
      if (args?.href && (VALID_ROUTES as readonly string[]).includes(args.href) && args.label) {
        actions.push({ label: args.label, href: args.href });
        return { ok: true, suggested: true };
      }
      return { ok: false, error: "href must be one of the app's real routes" };
    },
  };

  const chatHistory: ChatMessage[] = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: message },
  ];

  const result = await runToolLoop({
    systemPrompt: buildSystemPrompt(pathname),
    history: chatHistory,
    tools: [...limeAssistantToolDefs, suggestNavigationToolDef],
    executors,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ text: result.value.text, actions });
}
