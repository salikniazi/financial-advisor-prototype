import { PropertyAsset } from "@/lib/types";
import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

// Mock FBR-style per-square-foot valuation table (illustrative, not real notified rates)
export const fbrRateTable = [
  { locality: "DHA Phase 6, Karachi", type: "Residential (Built-up)", ratePerSqFt: 18500 },
  { locality: "DHA Phase 6, Karachi", type: "Residential (Open Plot)", ratePerSqFt: 15200 },
  { locality: "Bahria Town, Lahore", type: "Residential (Built-up)", ratePerSqFt: 12800 },
  { locality: "Gulberg III, Lahore", type: "Commercial", ratePerSqFt: 42000 },
  { locality: "F-10, Islamabad", type: "Residential (Built-up)", ratePerSqFt: 21400 },
  { locality: "E-11, Islamabad", type: "Flat / Apartment", ratePerSqFt: 16900 },
  { locality: "Clifton Block 5, Karachi", type: "Flat / Apartment", ratePerSqFt: 19700 },
];

export const properties: PropertyAsset[] = [
  {
    id: "dha-6-house",
    nickname: "DHA Phase 6 House",
    locality: "DHA Phase 6, Karachi",
    type: "Residential (Built-up)",
    sizeSqFt: 2700,
    ratePerSqFt: 18500,
    purchaseDate: "2019-03-14",
    purchasePrice: 32_000_000,
    history: buildTrendSeries(months, 2700 * 18500, 0.28, 0.02, 41),
  },
  {
    id: "e11-flat",
    nickname: "E-11 Apartment",
    locality: "E-11, Islamabad",
    type: "Flat / Apartment",
    sizeSqFt: 1450,
    ratePerSqFt: 16900,
    purchaseDate: "2022-07-02",
    purchasePrice: 19_500_000,
    history: buildTrendSeries(months, 1450 * 16900, 0.14, 0.015, 42),
  },
];

export function propertyById(id: string): PropertyAsset | null {
  return properties.find((p) => p.id === id) ?? null;
}
