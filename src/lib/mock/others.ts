import { OtherAsset } from "@/lib/types";

export const otherAssets: OtherAsset[] = [
  {
    id: "fd-alfalah",
    name: "Bank Alfalah Fixed Deposit",
    type: "Fixed Deposit",
    currentValue: 800_000,
    fields: {
      Institution: "Bank Alfalah",
      "Principal Amount": "Rs 750,000",
      "Interest Rate": "13.5% p.a.",
      "Maturity Date": "15 Dec 2026",
      "Current Value (with accrued interest)": "Rs 800,000",
    },
  },
  {
    id: "nsc-defence",
    name: "Defence Savings Certificate",
    type: "National Savings Certificate",
    currentValue: 350_000,
    fields: {
      Issuer: "Central Directorate of National Savings",
      "Face Value": "Rs 300,000",
      "Profit Rate": "12.8% p.a. (compounding)",
      "Maturity Date": "02 Jun 2031",
      "Current Value": "Rs 350,000",
    },
  },
];

export const othersTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
