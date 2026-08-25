import { MutualFund, MutualFundHolding } from "@/lib/types";

export const mutualFunds: MutualFund[] = [];

export const mutualFundHoldings: MutualFundHolding[] = [];

export function fundById(id: string): MutualFund | null {
  return mutualFunds.find((f) => f.id === id) ?? null;
}
