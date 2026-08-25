import { PropertyAsset } from "@/lib/types";

// Mock FBR-style per-square-foot valuation table (illustrative, not real notified rates)
export const fbrRateTable: { locality: string; type: string; ratePerSqFt: number }[] = [];

export const properties: PropertyAsset[] = [];

export function propertyById(id: string): PropertyAsset | null {
  return properties.find((p) => p.id === id) ?? null;
}
