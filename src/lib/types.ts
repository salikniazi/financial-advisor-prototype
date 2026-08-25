export type MonthPoint = { month: string; value: number };

export type AssetCategoryKey =
  | "bank"
  | "stocks"
  | "mutualFunds"
  | "property"
  | "vehicle"
  | "crypto"
  | "gold"
  | "others";

export type LiabilityCategoryKey = "loans" | "creditCards" | "bnpl";

export type CategoryRow = {
  key: AssetCategoryKey | LiabilityCategoryKey;
  label: string;
  description: string;
  source: string;
  history: MonthPoint[]; // most recent first
  href: string;
  hasData: boolean;
  isLiability?: boolean;
};

export type StockHolding = {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  price: number;
  dayChangePct: number;
  history: MonthPoint[];
};

export type WatchlistItem = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  dayChangePct: number;
};

export type CryptoHolding = {
  symbol: string;
  name: string;
  category: string;
  amount: number;
  avgCost: number;
  price: number;
  dayChangePct: number;
  history: MonthPoint[];
};

export type MutualFund = {
  id: string;
  name: string;
  amc: string;
  category: string;
  nav: number;
  riskRating: "Low" | "Moderate" | "High";
  return1M: number;
  return1Y: number;
  expenseRatio: number;
  manager: string;
  benchmarkReturn1Y: number;
  history: MonthPoint[];
};

export type MutualFundHolding = {
  fundId: string;
  units: number;
  avgCost: number;
};

export type PropertyAsset = {
  id: string;
  nickname: string;
  locality: string;
  type: string;
  sizeSqFt: number;
  ratePerSqFt: number;
  purchaseDate: string;
  purchasePrice: number;
  history: MonthPoint[];
};

export type VehicleAsset = {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  history: MonthPoint[];
};

export type GoldAsset = {
  id: string;
  type: string;
  weightGrams: number;
  purity: "24k" | "22k" | "21k";
  purchaseDate: string;
  purchasePrice: number;
  history: MonthPoint[];
};

export type OtherAsset = {
  id: string;
  name: string;
  type: string;
  currentValue: number;
  fields: Record<string, string>;
};

// The shape the "Others" asset-parsing AI extracts, before an id is assigned.
export type ParsedAsset = {
  name: string;
  type: string;
  currentValue: number;
  fields: Record<string, string>;
};
