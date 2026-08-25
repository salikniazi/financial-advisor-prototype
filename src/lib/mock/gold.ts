import { GoldAsset } from "@/lib/types";

export const GOLD_SOURCE = "Sarafa Bazaar Karachi rates";

// Rs per gram, mock current rates
export const goldRates: Record<GoldAsset["purity"], number> = {
  "24k": 0,
  "22k": 0,
  "21k": 0,
};

export const goldItems: GoldAsset[] = [];

export function goldById(id: string): GoldAsset | null {
  return goldItems.find((g) => g.id === id) ?? null;
}
