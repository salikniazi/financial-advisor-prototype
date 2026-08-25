import { CategoryRow, MonthPoint } from "@/lib/types";
import { lastMonths } from "./months";
import { bankHistory, bankTotal, loansHistory, loansTotal, creditCardsHistory, creditCardsTotal, bnplHistory, bnplTotal } from "./bank";
import { stockHoldings } from "./stocks";
import { cryptoHoldings } from "./crypto";
import { mutualFunds, mutualFundHoldings } from "./mutualFunds";
import { properties } from "./property";
import { vehicles } from "./vehicle";
import { goldItems } from "./gold";
import { othersTotal } from "./others";

const months = lastMonths(12);

function sumHistories(histories: MonthPoint[][]): MonthPoint[] {
  return months.map((month, i) => ({
    month,
    value: Math.round(histories.reduce((s, h) => s + (h[i]?.value ?? 0), 0)),
  }));
}

const stocksHistory = sumHistories(stockHoldings.map((h) => h.history));
const stocksTotal = stockHoldings.reduce((s, h) => s + h.shares * h.price, 0);

const cryptoHistory = sumHistories(cryptoHoldings.map((h) => h.history));
const cryptoTotal = cryptoHoldings.reduce((s, h) => s + h.amount * h.price, 0);

const mfHistories = mutualFundHoldings.map((h) => {
  const fund = mutualFunds.find((f) => f.id === h.fundId)!;
  return fund.history.map((p) => ({ month: p.month, value: p.value * h.units }));
});
const mutualFundsHistory = sumHistories(mfHistories);
const mutualFundsTotal = mutualFundHoldings.reduce((s, h) => {
  const fund = mutualFunds.find((f) => f.id === h.fundId)!;
  return s + h.units * fund.nav;
}, 0);

const propertyHistory = sumHistories(properties.map((p) => p.history));
const propertyTotal = properties.reduce((s, p) => s + p.sizeSqFt * p.ratePerSqFt, 0);

const vehicleHistory = sumHistories(vehicles.map((v) => v.history));
const vehicleTotal = vehicles.reduce((s, v) => s + v.currentValue, 0);

const goldHistory = sumHistories(goldItems.map((g) => g.history));
const goldTotal = goldItems.reduce((s, g) => {
  const rate = { "24k": 27850, "22k": 25530, "21k": 24370 }[g.purity];
  return s + g.weightGrams * rate;
}, 0);

export const assetRows: CategoryRow[] = [
  {
    key: "bank",
    label: "Bank Accounts",
    description: "Your current, savings, and fixed deposit account balances.",
    source: "Pulled from your bank account statement",
    history: bankHistory,
    href: "/bank",
    hasData: true,
  },
  {
    key: "stocks",
    label: "Stocks",
    description: "PSX-listed equities held in your brokerage account.",
    source: "Pulled from your CDC investor account & broker statement",
    history: stocksHistory,
    href: "/stocks",
    hasData: true,
  },
  {
    key: "mutualFunds",
    label: "Mutual Funds",
    description: "Units held across AMC-managed mutual funds.",
    source: "Pulled from your AMC account statements (MUFAP)",
    history: mutualFundsHistory,
    href: "/mutual-funds",
    hasData: true,
  },
  {
    key: "property",
    label: "Property",
    description: "Residential, commercial, and land holdings.",
    source: "Estimated using FBR's published per-square-foot valuation rates",
    history: propertyHistory,
    href: "/property",
    hasData: true,
  },
  {
    key: "vehicle",
    label: "Vehicle",
    description: "Cars and other registered vehicles you own.",
    source: "Estimated using Pakwheels' resale valuations for this make/model/year",
    history: vehicleHistory,
    href: "/vehicle",
    hasData: true,
  },
  {
    key: "crypto",
    label: "Crypto",
    description: "Digital assets held across connected exchange wallets.",
    source: "Data sourced from Binance P2P (via connected wallet)",
    history: cryptoHistory,
    href: "/crypto",
    hasData: true,
  },
  {
    key: "gold",
    label: "Gold",
    description: "Jewelry, bars, and coins valued at current market rate.",
    source: "Estimated using Sarafa Bazaar Karachi rates",
    history: goldHistory,
    href: "/gold",
    hasData: true,
  },
  {
    key: "others",
    label: "Others",
    description: "Fixed deposits, savings certificates, and anything else you've added manually.",
    source: "Added and structured by you, with AI assistance",
    history: months.map((month) => ({ month, value: othersTotal })),
    href: "/others",
    hasData: true,
  },
];

export const liabilityRows: CategoryRow[] = [
  {
    key: "loans",
    label: "Loans",
    description: "Outstanding balances on auto, personal, or home loans.",
    source: "Pulled from your bank loan account statement",
    history: loansHistory,
    href: "/liabilities",
    hasData: true,
    isLiability: true,
  },
  {
    key: "creditCards",
    label: "Credit Cards",
    description: "Outstanding balances across your credit cards.",
    source: "Pulled from your credit card statement",
    history: creditCardsHistory,
    href: "/liabilities",
    hasData: true,
    isLiability: true,
  },
  {
    key: "bnpl",
    label: "BNPL",
    description: "Buy-now-pay-later installment plans in progress.",
    source: "Pulled from connected BNPL provider accounts",
    history: bnplHistory,
    href: "/liabilities",
    hasData: true,
    isLiability: true,
  },
];

export function netWorthByMonth(): MonthPoint[] {
  return months.map((month, i) => {
    const assets = assetRows.reduce((s, r) => s + (r.history[i]?.value ?? 0), 0);
    const liabilities = liabilityRows.reduce((s, r) => s + (r.history[i]?.value ?? 0), 0);
    return { month, value: assets - liabilities };
  });
}

export const totals = {
  bank: bankTotal,
  stocks: stocksTotal,
  mutualFunds: mutualFundsTotal,
  property: propertyTotal,
  vehicle: vehicleTotal,
  crypto: cryptoTotal,
  gold: goldTotal,
  others: othersTotal,
  loans: loansTotal,
  creditCards: creditCardsTotal,
  bnpl: bnplTotal,
};

export const totalAssets =
  totals.bank + totals.stocks + totals.mutualFunds + totals.property + totals.vehicle + totals.crypto + totals.gold + totals.others;
export const totalLiabilities = totals.loans + totals.creditCards + totals.bnpl;
export const currentNetWorth = totalAssets - totalLiabilities;
