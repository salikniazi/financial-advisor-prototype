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

export const coinUniverse: CoinMeta[] = [
  { symbol: "BTC", name: "Bitcoin", category: "Layer 1", marketCapUsd: 1_280_000_000_000, volume24hUsd: 28_400_000_000, circulatingSupply: "19.8M BTC" },
  { symbol: "ETH", name: "Ethereum", category: "Layer 1", marketCapUsd: 410_000_000_000, volume24hUsd: 14_200_000_000, circulatingSupply: "120.4M ETH" },
  { symbol: "USDT", name: "Tether", category: "Stablecoin", marketCapUsd: 118_000_000_000, volume24hUsd: 52_000_000_000, circulatingSupply: "118.0B USDT" },
  { symbol: "SOL", name: "Solana", category: "Layer 1", marketCapUsd: 92_000_000_000, volume24hUsd: 3_800_000_000, circulatingSupply: "480.2M SOL" },
  { symbol: "BNB", name: "BNB", category: "Layer 1", marketCapUsd: 78_000_000_000, volume24hUsd: 1_600_000_000, circulatingSupply: "145.9M BNB" },
  { symbol: "USDC", name: "USD Coin", category: "Stablecoin", marketCapUsd: 41_000_000_000, volume24hUsd: 6_200_000_000, circulatingSupply: "41.0B USDC" },
  { symbol: "ARB", name: "Arbitrum", category: "Layer 2", marketCapUsd: 4_100_000_000, volume24hUsd: 210_000_000, circulatingSupply: "3.9B ARB" },
  { symbol: "AAVE", name: "Aave", category: "DeFi", marketCapUsd: 2_600_000_000, volume24hUsd: 180_000_000, circulatingSupply: "16.1M AAVE" },
];

const usdToPkr = 285;

function meta(symbol: string): CoinMeta {
  const m = coinUniverse.find((c) => c.symbol === symbol);
  if (!m) throw new Error(`unknown coin ${symbol}`);
  return m;
}

function priceUsd(symbol: string): number {
  switch (symbol) {
    case "BTC": return 96500;
    case "ETH": return 3420;
    case "USDT": return 1;
    case "SOL": return 192;
    case "BNB": return 542;
    case "USDC": return 1;
    case "ARB": return 1.06;
    case "AAVE": return 162;
    default: return 0;
  }
}

function makeHolding(symbol: string, amount: number, avgCostUsd: number, dayChangePct: number, growthPct: number, seed: number): CryptoHolding {
  const m = meta(symbol);
  const price = priceUsd(symbol) * usdToPkr;
  return {
    symbol,
    name: m.name,
    category: m.category,
    amount,
    avgCost: avgCostUsd * usdToPkr,
    price,
    dayChangePct,
    history: buildTrendSeries(months, price * amount, growthPct, 0.09, seed),
  };
}

export const cryptoHoldings: CryptoHolding[] = [
  makeHolding("BTC", 0.085, 62000, 2.4, 0.55, 21),
  makeHolding("ETH", 1.2, 2650, 3.1, 0.38, 22),
  makeHolding("USDT", 850, 1, 0, 0.02, 23),
  makeHolding("SOL", 12, 118, 5.6, 0.68, 24),
  makeHolding("ARB", 2400, 0.85, -1.8, 0.18, 25),
];

export const cryptoWatchlist = [
  { symbol: "BNB", name: meta("BNB").name, price: priceUsd("BNB") * usdToPkr, dayChangePct: 1.4 },
  { symbol: "AAVE", name: meta("AAVE").name, price: priceUsd("AAVE") * usdToPkr, dayChangePct: -0.9 },
  { symbol: "USDC", name: meta("USDC").name, price: priceUsd("USDC") * usdToPkr, dayChangePct: 0 },
];

export const cryptoMoversGainers = [
  { symbol: "SOL", name: "Solana", price: priceUsd("SOL") * usdToPkr, changePct: 5.6 },
  { symbol: "ETH", name: "Ethereum", price: priceUsd("ETH") * usdToPkr, changePct: 3.1 },
  { symbol: "BTC", name: "Bitcoin", price: priceUsd("BTC") * usdToPkr, changePct: 2.4 },
  { symbol: "BNB", name: "BNB", price: priceUsd("BNB") * usdToPkr, changePct: 1.4 },
  { symbol: "USDC", name: "USD Coin", price: priceUsd("USDC") * usdToPkr, changePct: 0.1 },
];

export const cryptoMoversLosers = [
  { symbol: "ARB", name: "Arbitrum", price: priceUsd("ARB") * usdToPkr, changePct: -1.8 },
  { symbol: "AAVE", name: "Aave", price: priceUsd("AAVE") * usdToPkr, changePct: -0.9 },
];

export const dominanceBreakdown = [
  { label: "BTC", pct: 46.2 },
  { label: "ETH", pct: 14.8 },
  { label: "Stablecoins", pct: 22.4 },
  { label: "Altcoins", pct: 16.6 },
];

export const cryptoNews = [
  { headline: "PVARA issues draft licensing framework for virtual asset service providers", source: "State Bank of Pakistan", time: "3h ago" },
  { headline: "Bitcoin holds above $95K as ETF inflows continue for sixth week", source: "CoinDesk", time: "6h ago" },
  { headline: "Pakistan's Virtual Assets Act 2026: what it means for local investors", source: "Profit by Pakistan Today", time: "1d ago" },
  { headline: "Solana network activity hits new high on DeFi and payments volume", source: "The Block", time: "2d ago" },
  { headline: "Ethereum layer-2 fees drop sharply after latest network upgrade", source: "CoinDesk", time: "3d ago" },
];

export const cryptoTradeHistory = [
  { date: "2026-08-18", type: "Buy", symbol: "SOL", amount: 3, price: priceUsd("SOL") * usdToPkr, total: 3 * priceUsd("SOL") * usdToPkr },
  { date: "2026-08-02", type: "Transfer In", symbol: "USDT", amount: 300, price: usdToPkr, total: 300 * usdToPkr },
  { date: "2026-07-20", type: "Buy", symbol: "ETH", amount: 0.4, price: priceUsd("ETH") * usdToPkr, total: 0.4 * priceUsd("ETH") * usdToPkr },
  { date: "2026-06-25", type: "Transfer Out", symbol: "BTC", amount: 0.015, price: priceUsd("BTC") * usdToPkr, total: 0.015 * priceUsd("BTC") * usdToPkr },
  { date: "2026-05-30", type: "Buy", symbol: "ARB", amount: 900, price: priceUsd("ARB") * usdToPkr, total: 900 * priceUsd("ARB") * usdToPkr },
  { date: "2026-04-14", type: "Buy", symbol: "BTC", amount: 0.03, price: priceUsd("BTC") * usdToPkr, total: 0.03 * priceUsd("BTC") * usdToPkr },
];

export function getCoinDetail(symbol: string) {
  const s = symbol.toUpperCase();
  const m = coinUniverse.find((c) => c.symbol === s);
  if (!m) return null;
  const holding = cryptoHoldings.find((h) => h.symbol === s) ?? null;
  const price = priceUsd(s) * usdToPkr;
  const priceHistory = buildTrendSeries(months, price, 0.32, 0.11, s.length * 9);
  return { meta: m, holding, priceHistory, price };
}
