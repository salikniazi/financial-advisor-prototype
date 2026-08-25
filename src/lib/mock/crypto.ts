import { CryptoHolding } from "@/lib/types";
import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export const EXCHANGE_NAME = "Binance P2P (via connected wallet)";

export type CoinMeta = {
  symbol: string;
  name: string;
  category: "Layer 1" | "Stablecoin" | "DeFi" | "Layer 2";
  marketCapUsd: number;
  volume24hUsd: number;
  circulatingSupply: string;
};

export const coinUniverse: CoinMeta[] = [];

export const cryptoHoldings: CryptoHolding[] = [];

export const cryptoWatchlist: { symbol: string; name: string; price: number; dayChangePct: number }[] = [];

export const cryptoMoversGainers: { symbol: string; name: string; price: number; changePct: number }[] = [];

export const cryptoMoversLosers: { symbol: string; name: string; price: number; changePct: number }[] = [];

export const dominanceBreakdown: { label: string; pct: number }[] = [];

export const cryptoNews: { headline: string; source: string; time: string }[] = [];

export const cryptoTradeHistory: { date: string; type: string; symbol: string; amount: number; price: number; total: number }[] = [];

export function getCoinDetail(symbol: string) {
  const s = symbol.toUpperCase();
  const m = coinUniverse.find((c) => c.symbol === s);
  if (!m) return null;
  const holding = cryptoHoldings.find((h) => h.symbol === s) ?? null;
  const price = 0;
  const priceHistory = buildTrendSeries(months, price, 0.32, 0.11, s.length * 9);
  return { meta: m, holding, priceHistory, price };
}
