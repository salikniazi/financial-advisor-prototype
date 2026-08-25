export type ResearchDomain = "stocks" | "crypto";

const stockReplies: { test: RegExp; reply: string }[] = [
  {
    test: /(bank|banking)/,
    reply: "Commercial banks (HBL, UBL, MEBL) are trading at low single-digit P/Es with healthy dividend yields, but face margin pressure if the policy rate keeps easing. Islamic banks like MEBL have outgrown conventional peers over the last two years.",
  },
  {
    test: /(tech|it sector|systems|trg)/,
    reply: "Technology & IT names (SYS, TRG) have the highest growth and highest valuations on the exchange. They're more volatile and carry FX-linked revenue exposure — worth sizing carefully in a PSX-heavy portfolio.",
  },
  {
    test: /(dividend)/,
    reply: "E&P names (OGDC, PPL, MARI, POL) and fertilizer stocks (ENGRO, FFC) currently offer some of the highest dividend yields on the PSX, generally in the 8-12% range.",
  },
  {
    test: /(pe ratio|p\/e|valuation)/,
    reply: "PSX overall trades at a market P/E of roughly 6-7x, which is low by regional standards — often attributed to Pakistan's macro risk premium. Compare a stock's P/E to its sector average before reading too much into it alone.",
  },
  {
    test: /(best|top pick|recommend)/,
    reply: "I can't tell you to buy a specific stock, but E&P and fertilizer sectors are showing the strongest earnings momentum this quarter, and technology names offer the highest growth if you can stomach the volatility. Check the Screener to compare by P/E and dividend yield.",
  },
];

const cryptoReplies: { test: RegExp; reply: string }[] = [
  {
    test: /(pvara|regulat|legal|virtual assets act)/,
    reply: "Pakistan's Virtual Assets Act 2026 establishes PVARA as the regulator for virtual asset service providers. Licensing is still rolling out, so treat any exchange or custodian as pre-regulatory until they're formally licensed.",
  },
  {
    test: /(stablecoin|usdt|usdc)/,
    reply: "Stablecoins like USDT and USDC track the US Dollar and are commonly used to reduce volatility exposure while staying in crypto. They still carry counterparty and regulatory risk, especially given Pakistan's evolving stance on virtual assets.",
  },
  {
    test: /(bitcoin|btc)/,
    reply: "Bitcoin dominance sits around 46% of total crypto market cap currently. It tends to be less volatile than altcoins but still moves 3-5x more than typical equity markets.",
  },
  {
    test: /(best|top pick|recommend)/,
    reply: "I won't recommend a specific coin, but large-cap assets (BTC, ETH) tend to carry lower relative volatility than altcoins. Diversifying across a few categories rather than concentrating in one token is a common approach.",
  },
];

export function getResearchReply(message: string, domain: ResearchDomain): string {
  const m = message.toLowerCase();
  const set = domain === "stocks" ? stockReplies : cryptoReplies;
  for (const r of set) {
    if (r.test.test(m)) return r.reply;
  }
  return domain === "stocks"
    ? "I can help with PSX sectors, valuations, dividend yields, and general market questions. Try asking about a sector, or what 'P/E ratio' means."
    : "I can help with market cap, dominance trends, and Pakistan's evolving virtual asset regulation. Try asking about PVARA, stablecoins, or Bitcoin dominance.";
}

export const stockResearchPrompts = ["How's the banking sector doing?", "Which stocks pay the best dividends?", "What's a healthy P/E ratio?"];
export const cryptoResearchPrompts = ["What is PVARA?", "Are stablecoins safe to hold?", "What's Bitcoin's market dominance?"];
