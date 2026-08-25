import { ToolDef, ToolExecutor } from "@/lib/ai/openrouter";
import { stockUniverse, stockHoldings, sectorPerformance, marketMoversGainers, marketMoversLosers } from "@/lib/mock/stocks";
import { cryptoHoldings, coinUniverse, dominanceBreakdown, cryptoMoversGainers, cryptoMoversLosers } from "@/lib/mock/crypto";

export const researchToolDefs: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_stock_universe",
      description:
        "Returns the full list of PSX stocks Lime tracks, each with sector, P/E ratio, market cap, and 52-week high/low, plus today's sector performance and top movers. Call this to answer questions about PSX sectors, valuations, or which stocks look interesting — use the real numbers returned, don't estimate.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_stock_holdings",
      description:
        "Returns the user's own PSX stock holdings (ticker, sector, shares, value). Call this only if the user asks about their own positions or concentration, e.g. 'how concentrated am I'.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_market_data",
      description:
        "Returns crypto market structure data: the coin universe (symbol, category, market cap, 24h volume), the market cap dominance breakdown (BTC/ETH/Stablecoins/Altcoins), and today's top movers. Call this for questions about crypto market cap, dominance, or category breakdowns.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_crypto_holdings",
      description: "Returns the user's own crypto holdings (symbol, category, amount, value). Call this only if asked about their own crypto positions.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

export function buildResearchExecutors(): Record<string, ToolExecutor> {
  return {
    get_stock_universe: () => ({ stockUniverse, sectorPerformance, marketMoversGainers, marketMoversLosers }),
    get_user_stock_holdings: () => ({
      holdings: stockHoldings.map((h) => ({ ticker: h.ticker, sector: h.sector, shares: h.shares, currentValue: h.shares * h.price })),
    }),
    get_crypto_market_data: () => ({ coinUniverse, dominanceBreakdown, cryptoMoversGainers, cryptoMoversLosers }),
    get_user_crypto_holdings: () => ({
      holdings: cryptoHoldings.map((h) => ({ symbol: h.symbol, category: h.category, amount: h.amount, currentValue: h.amount * h.price })),
    }),
  };
}
