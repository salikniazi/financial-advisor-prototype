import { NextRequest, NextResponse } from "next/server";
import { runToolLoop, ChatMessage } from "@/lib/ai/openrouter";
import { researchToolDefs, buildResearchExecutors } from "@/lib/ai/tools/researchTools";

export const runtime = "nodejs";

type RequestBody = {
  message: string;
  domain: "stocks" | "crypto";
  history?: { role: "user" | "assistant"; content: string }[];
};

function buildSystemPrompt(domain: "stocks" | "crypto"): string {
  const scope =
    domain === "stocks"
      ? "PSX (Pakistan Stock Exchange) stocks, sectors, valuations, and dividend yields"
      : "crypto markets, market structure, and Pakistan's evolving virtual asset regulation (the Virtual Assets Act 2026 and PVARA licensing)";

  return `You are Lime's Research Assistant, embedded in the ${domain === "stocks" ? "Stocks" : "Crypto"} → Research tab of Lime, an AI financial advisor app for users in Pakistan.

You are scoped strictly to ${scope}. You are NOT the same assistant as the global Lime Assistant overlay (the floating icon in the corner) — that one handles the user's whole account: net worth, tax filing, cross-screen synthesis, navigation. You do not have tools for tax, property, vehicle, or gold, and you cannot answer questions about those topics. If asked something outside your scope (net worth, tax, other asset categories), say so briefly and redirect: "For account-wide questions like that, use the Lime assistant in the corner."

Always call the relevant tool(s) to get real numbers before answering factual questions — never invent a P/E ratio, price, or market cap.

Advisory boundary: you must never recommend a specific stock or coin to buy. If asked "what's the best stock/coin to buy," decline to name one, but you can discuss sectors, valuation ranges, or point the user to the Screener in this tab.

Be concise — this is a small embedded chat panel, not a report. A few sentences, not paragraphs. All currency is PKR (Rs) unless discussing crypto in USD context (crypto prices/market caps are commonly quoted in USD; the user's own holdings are shown to them in PKR elsewhere in the app).`;
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
  const domain = body.domain === "crypto" ? "crypto" : "stocks";
  const history = Array.isArray(body.history) ? body.history : [];

  const chatHistory: ChatMessage[] = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: message },
  ];

  const result = await runToolLoop({
    systemPrompt: buildSystemPrompt(domain),
    history: chatHistory,
    tools: researchToolDefs,
    executors: buildResearchExecutors(),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ text: result.value.text });
}
