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

export const stockUniverse: StockMeta[] = [
  { ticker: "OGDC", name: "Oil & Gas Development Co.", sector: "Exploration & Production", peRatio: 6.2, marketCap: 950_00_00_00_000, week52High: 168.4, week52Low: 98.1 },
  { ticker: "LUCK", name: "Lucky Cement Ltd.", sector: "Cement", peRatio: 9.8, marketCap: 420_00_00_00_000, week52High: 1180, week52Low: 720 },
  { ticker: "HBL", name: "Habib Bank Ltd.", sector: "Commercial Banks", peRatio: 5.1, marketCap: 310_00_00_00_000, week52High: 165.2, week52Low: 102.5 },
  { ticker: "ENGRO", name: "Engro Corporation Ltd.", sector: "Fertilizer", peRatio: 7.4, marketCap: 280_00_00_00_000, week52High: 340, week52Low: 245 },
  { ticker: "MEBL", name: "Meezan Bank Ltd.", sector: "Islamic Banks", peRatio: 6.9, marketCap: 505_00_00_00_000, week52High: 285, week52Low: 175 },
  { ticker: "SYS", name: "Systems Ltd.", sector: "Technology & IT", peRatio: 18.3, marketCap: 165_00_00_00_000, week52High: 620, week52Low: 380 },
  { ticker: "PSO", name: "Pakistan State Oil Co.", sector: "Oil Marketing", peRatio: 4.8, marketCap: 98_00_00_00_000, week52High: 245, week52Low: 130 },
  { ticker: "FFC", name: "Fauji Fertilizer Co.", sector: "Fertilizer", peRatio: 8.1, marketCap: 245_00_00_00_000, week52High: 195, week52Low: 118 },
  { ticker: "UBL", name: "United Bank Ltd.", sector: "Commercial Banks", peRatio: 4.6, marketCap: 290_00_00_00_000, week52High: 320, week52Low: 205 },
  { ticker: "MARI", name: "Mari Petroleum Co.", sector: "Exploration & Production", peRatio: 7.7, marketCap: 380_00_00_00_000, week52High: 2850, week52Low: 1650 },
  { ticker: "TRG", name: "TRG Pakistan Ltd.", sector: "Technology & IT", peRatio: 24.5, marketCap: 88_00_00_00_000, week52High: 145, week52Low: 62 },
  { ticker: "HUBC", name: "Hub Power Company Ltd.", sector: "Power Generation", peRatio: 6.3, marketCap: 175_00_00_00_000, week52High: 145, week52Low: 88 },
  { ticker: "PPL", name: "Pakistan Petroleum Ltd.", sector: "Exploration & Production", peRatio: 5.9, marketCap: 410_00_00_00_000, week52High: 210, week52Low: 128 },
  { ticker: "NESTLE", name: "Nestle Pakistan Ltd.", sector: "Food & Personal Care", peRatio: 28.1, marketCap: 315_00_00_00_000, week52High: 8200, week52Low: 6100 },
  { ticker: "POL", name: "Pakistan Oilfields Ltd.", sector: "Exploration & Production", peRatio: 6.8, marketCap: 155_00_00_00_000, week52High: 620, week52Low: 410 },
];

function meta(ticker: string): StockMeta {
  const m = stockUniverse.find((s) => s.ticker === ticker);
  if (!m) throw new Error(`unknown ticker ${ticker}`);
  return m;
}

function makeHolding(ticker: string, shares: number, avgCost: number, price: number, dayChangePct: number, growthPct: number, seed: number): StockHolding {
  const m = meta(ticker);
  return {
    ticker,
    name: m.name,
    sector: m.sector,
    shares,
    avgCost,
    price,
    dayChangePct,
    history: buildTrendSeries(months, price * shares, growthPct, 0.05, seed),
  };
}

export const stockHoldings: StockHolding[] = [
  makeHolding("OGDC", 1200, 118.5, 154.2, 1.8, 0.3, 11),
  makeHolding("MEBL", 400, 210, 268.75, 2.4, 0.42, 12),
  makeHolding("SYS", 150, 410, 545.6, -1.2, 0.28, 13),
  makeHolding("LUCK", 90, 890, 1042.3, 0.6, 0.15, 14),
  makeHolding("HBL", 300, 128, 151.4, -0.4, 0.12, 15),
  makeHolding("ENGRO", 180, 265, 312.8, 1.1, 0.14, 16),
  makeHolding("TRG", 500, 78, 96.4, -2.8, 0.22, 17),
];

export const stockWatchlist: WatchlistItem[] = [
  { ticker: "FFC", name: meta("FFC").name, sector: meta("FFC").sector, price: 174.2, dayChangePct: 0.9 },
  { ticker: "UBL", name: meta("UBL").name, sector: meta("UBL").sector, price: 288.5, dayChangePct: -0.3 },
  { ticker: "MARI", name: meta("MARI").name, sector: meta("MARI").sector, price: 2410, dayChangePct: 2.1 },
  { ticker: "HUBC", name: meta("HUBC").name, sector: meta("HUBC").sector, price: 121.6, dayChangePct: 0.4 },
  { ticker: "NESTLE", name: meta("NESTLE").name, sector: meta("NESTLE").sector, price: 7450, dayChangePct: -0.6 },
];

export const marketMoversGainers = [
  { ticker: "PPL", name: meta("PPL").name, price: 198.4, changePct: 5.8 },
  { ticker: "MARI", name: meta("MARI").name, price: 2410, changePct: 4.3 },
  { ticker: "SYS", name: meta("SYS").name, price: 545.6, changePct: 3.9 },
  { ticker: "ENGRO", name: meta("ENGRO").name, price: 312.8, changePct: 3.1 },
  { ticker: "MEBL", name: meta("MEBL").name, price: 268.75, changePct: 2.4 },
];

export const marketMoversLosers = [
  { ticker: "TRG", name: meta("TRG").name, price: 96.4, changePct: -2.8 },
  { ticker: "NESTLE", name: meta("NESTLE").name, price: 7450, changePct: -1.9 },
  { ticker: "HBL", name: meta("HBL").name, price: 151.4, changePct: -1.4 },
  { ticker: "POL", name: meta("POL").name, price: 512.3, changePct: -1.1 },
  { ticker: "PSO", name: meta("PSO").name, price: 182.5, changePct: -0.8 },
];

export const sectorPerformance = [
  { sector: "Exploration & Production", changePct: 3.4 },
  { sector: "Technology & IT", changePct: 2.1 },
  { sector: "Fertilizer", changePct: 1.6 },
  { sector: "Islamic Banks", changePct: 1.2 },
  { sector: "Cement", changePct: 0.4 },
  { sector: "Commercial Banks", changePct: -0.3 },
  { sector: "Power Generation", changePct: -0.9 },
  { sector: "Oil Marketing", changePct: -1.5 },
  { sector: "Food & Personal Care", changePct: -1.8 },
];

export const stockNews = [
  { headline: "PSX benchmark index closes above 96,000 for the first time on strong E&P earnings", source: "Business Recorder", time: "2h ago" },
  { headline: "SBP holds policy rate at 11%, cites easing inflation outlook", source: "Dawn Business", time: "5h ago" },
  { headline: "OGDC announces new gas discovery in Sindh block, shares rally", source: "PSX Notices", time: "1d ago" },
  { headline: "Foreign investors turn net buyers on PSX for third straight session", source: "Business Recorder", time: "1d ago" },
  { headline: "Cement dispatches rise 8% YoY as construction activity picks up", source: "Profit by Pakistan Today", time: "2d ago" },
  { headline: "Systems Ltd. wins new multi-year outsourcing contract in the Gulf", source: "Mettis Global", time: "3d ago" },
];

export const stockTradeHistory = [
  { date: "2026-08-12", type: "Buy", ticker: "MEBL", shares: 100, price: 262.1, amount: 26210 },
  { date: "2026-07-28", type: "Dividend", ticker: "OGDC", shares: 0, price: 0, amount: 4200 },
  { date: "2026-07-15", type: "Buy", ticker: "TRG", shares: 200, price: 84.5, amount: 16900 },
  { date: "2026-06-30", type: "Dividend", ticker: "HBL", shares: 0, price: 0, amount: 3150 },
  { date: "2026-06-10", type: "Sell", ticker: "PPL", shares: 150, price: 176.2, amount: 26430 },
  { date: "2026-05-22", type: "Buy", ticker: "ENGRO", shares: 90, price: 258.4, amount: 23256 },
  { date: "2026-04-18", type: "Buy", ticker: "SYS", shares: 75, price: 398.6, amount: 29895 },
  { date: "2026-03-05", type: "Dividend", ticker: "LUCK", shares: 0, price: 0, amount: 5400 },
];

export function getStockDetail(ticker: string) {
  const t = ticker.toUpperCase();
  const m = stockUniverse.find((s) => s.ticker === t);
  if (!m) return null;
  const holding = stockHoldings.find((h) => h.ticker === t) ?? null;
  const basePrice = holding?.price ?? (m.week52High + m.week52Low) / 2;
  const priceHistory = buildTrendSeries(months, basePrice, 0.18, 0.06, m.ticker.length * 7);
  return { meta: m, holding, priceHistory };
}
