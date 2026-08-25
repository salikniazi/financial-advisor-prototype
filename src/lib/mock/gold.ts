import { GoldAsset } from "@/lib/types";
import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export const GOLD_SOURCE = "Sarafa Bazaar Karachi rates";

// Rs per gram, mock current rates
export const goldRates: Record<GoldAsset["purity"], number> = {
  "24k": 27850,
  "22k": 25530,
  "21k": 24370,
};

export const goldItems: GoldAsset[] = [
  {
    id: "wedding-set",
    type: "Jewelry (Wedding Set)",
    weightGrams: 85,
    purity: "22k",
    purchaseDate: "2018-02-10",
    purchasePrice: 950_000,
    history: buildTrendSeries(months, 85 * goldRates["22k"], 0.42, 0.03, 61),
  },
  {
    id: "gold-bars",
    type: "Gold Bars (10g x 5)",
    weightGrams: 50,
    purity: "24k",
    purchaseDate: "2023-01-15",
    purchasePrice: 950_000,
    history: buildTrendSeries(months, 50 * goldRates["24k"], 0.31, 0.025, 62),
  },
];

export function goldById(id: string): GoldAsset | null {
  return goldItems.find((g) => g.id === id) ?? null;
}
