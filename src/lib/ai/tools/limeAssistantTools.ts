import { ToolDef, ToolExecutor } from "@/lib/ai/openrouter";
import { assetRows, liabilityRows, totals, totalAssets, totalLiabilities, currentNetWorth, netWorthByMonth } from "@/lib/mock/netWorth";
import { stockHoldings } from "@/lib/mock/stocks";
import { cryptoHoldings } from "@/lib/mock/crypto";
import { mutualFunds, mutualFundHoldings } from "@/lib/mock/mutualFunds";
import { filingSections, reconciliation, taxMeta, filerImpactRows, totalFilerSavings } from "@/lib/mock/tax";
import { loans, loansTotal, creditCards, creditCardsTotal, bnpl, bnplTotal } from "@/lib/mock/bank";

// Every route the assistant is allowed to link to. Keep this in sync with the
// app's actual routes — the suggest_navigation tool description below lists
// these explicitly so the model can't invent an invalid href.
export const VALID_ROUTES = [
  "/",
  "/bank",
  "/liabilities",
  "/stocks",
  "/stocks/watchlist",
  "/stocks/market",
  "/stocks/research",
  "/stocks/statement",
  "/crypto",
  "/crypto/watchlist",
  "/crypto/market",
  "/crypto/research",
  "/crypto/statement",
  "/mutual-funds",
  "/mutual-funds/explore",
  "/property",
  "/vehicle",
  "/gold",
  "/others",
  "/tax",
  "/tax/filer-impact",
  "/tax/filing-history",
] as const;

export const limeAssistantToolDefs: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "get_net_worth_summary",
      description:
        "Returns the user's current total net worth, total assets, total liabilities, and the month-over-month net worth series for the last 12 months. Call this for any question about overall net worth, how it changed, or trends over time.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_category_breakdown",
      description:
        "Returns every asset and liability category (bank, stocks, mutual funds, property, vehicle, crypto, gold, others, loans, credit cards, BNPL) with its current total value, a short description, and its data source. Call this to compare categories or find where most of the user's wealth sits.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_holdings",
      description:
        "Returns the user's individual PSX stock holdings: ticker, company name, sector, shares held, average cost, current price, and current value. Call this to answer questions about specific stocks, sector concentration, or portfolio composition — compute concentration/percentages yourself from the returned values rather than assuming a fixed number.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crypto_holdings",
      description:
        "Returns the user's individual crypto holdings: symbol, name, category (Layer 1/Layer 2/Stablecoin/DeFi), amount held, average cost, current price, and current value. Call this for questions about crypto composition, specific coins, or crypto concentration.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_mutual_fund_holdings",
      description:
        "Returns the user's mutual fund holdings (units held, average cost, current NAV, current value) along with each fund's category, risk rating, and returns. Call this for questions about fund performance or holdings.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_liabilities",
      description:
        "Returns the user's loans, credit card balances, and BNPL (buy-now-pay-later) installment plans, with outstanding amounts and totals. Call this for questions about debt, liabilities, or monthly obligations.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tax_filing_summary",
      description:
        "Returns the current tax year's filing status (filer/non-filer, deadline, submission status), the FBR Wealth Statement line items (which are auto-filled vs. need input), and the net-assets reconciliation (inflows/outflows) for the year. Call this for questions about tax filing status, deadlines, or what's in the current return.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_filer_impact",
      description:
        "Returns a category-by-category comparison of taxes and withholding costs as a filer vs. non-filer, plus the total estimated annual savings from becoming a filer. Call this when the user asks about filing status, becoming a filer, or tax savings from filing.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

export const suggestNavigationToolDef: ToolDef = {
  type: "function",
  function: {
    name: "suggest_navigation",
    description:
      "Offer the user a clickable link to a relevant screen in the app, as a next step after answering. Call this whenever pointing the user somewhere in the app would help — e.g. after discussing sector concentration, suggest the stocks research screen. Do not call this for a href outside the allowed list.",
    parameters: {
      type: "object",
      properties: {
        label: { type: "string", description: "Short button label, e.g. 'See analysts' top picks'." },
        href: { type: "string", enum: [...VALID_ROUTES], description: "Must be one of the app's real routes." },
      },
      required: ["label", "href"],
      additionalProperties: false,
    },
  },
};

export function buildLimeAssistantExecutors(): Record<string, ToolExecutor> {
  return {
    get_net_worth_summary: () => ({
      currentNetWorth,
      totalAssets,
      totalLiabilities,
      monthlyHistory: netWorthByMonth(), // most-recent-first
    }),
    get_category_breakdown: () => ({
      assets: assetRows.map((r) => ({ key: r.key, label: r.label, description: r.description, source: r.source, currentValue: r.history[0]?.value ?? 0 })),
      liabilities: liabilityRows.map((r) => ({ key: r.key, label: r.label, description: r.description, source: r.source, currentValue: r.history[0]?.value ?? 0 })),
      totals,
    }),
    get_stock_holdings: () => ({
      holdings: stockHoldings.map((h) => ({
        ticker: h.ticker,
        name: h.name,
        sector: h.sector,
        shares: h.shares,
        avgCost: h.avgCost,
        price: h.price,
        currentValue: h.shares * h.price,
        gain: h.shares * h.price - h.shares * h.avgCost,
      })),
    }),
    get_crypto_holdings: () => ({
      holdings: cryptoHoldings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        category: h.category,
        amount: h.amount,
        avgCost: h.avgCost,
        price: h.price,
        currentValue: h.amount * h.price,
        gain: h.amount * h.price - h.amount * h.avgCost,
      })),
    }),
    get_mutual_fund_holdings: () => ({
      holdings: mutualFundHoldings.map((h) => {
        const fund = mutualFunds.find((f) => f.id === h.fundId);
        return {
          fundId: h.fundId,
          name: fund?.name,
          category: fund?.category,
          riskRating: fund?.riskRating,
          return1Y: fund?.return1Y,
          units: h.units,
          avgCost: h.avgCost,
          nav: fund?.nav,
          currentValue: fund ? h.units * fund.nav : null,
        };
      }),
    }),
    get_liabilities: () => ({
      loans,
      loansTotal,
      creditCards,
      creditCardsTotal,
      bnpl,
      bnplTotal,
    }),
    get_tax_filing_summary: () => ({
      taxMeta,
      filingSections,
      reconciliation,
    }),
    get_filer_impact: () => ({
      filerImpactRows,
      totalFilerSavings,
    }),
  };
}
