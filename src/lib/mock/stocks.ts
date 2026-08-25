import { StockHolding, WatchlistItem } from "@/lib/types";
import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export type StockMeta = {
  ticker: string;
  name: string;
  sector: string;
  peRatio: number;
  marketCap: number; // Rs
  week52High: number;
  week52Low: number;
};

export const stockUniverse: StockMeta[] = [];

export const stockHoldings: StockHolding[] = [];

export const stockWatchlist: WatchlistItem[] = [];

export const marketMoversGainers: { ticker: string; name: string; price: number; changePct: number }[] = [];

export const marketMoversLosers: { ticker: string; name: string; price: number; changePct: number }[] = [];

export const sectorPerformance: { sector: string; changePct: number }[] = [];

export const stockNews: { headline: string; source: string; time: string }[] = [];

export const stockTradeHistory: { date: string; type: string; ticker: string; shares: number; price: number; amount: number }[] = [];

export function getStockDetail(ticker: string) {
  const t = ticker.toUpperCase();
  const m = stockUniverse.find((s) => s.ticker === t);
  if (!m) return null;
  const holding = stockHoldings.find((h) => h.ticker === t) ?? null;
  const basePrice = holding?.price ?? (m.week52High + m.week52Low) / 2;
  const priceHistory = buildTrendSeries(months, basePrice, 0.18, 0.06, m.ticker.length * 7);
  return { meta: m, holding, priceHistory };
}
