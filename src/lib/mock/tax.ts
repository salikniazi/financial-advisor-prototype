export type FilingLineStatus = "auto" | "needs-input";

export type FilingLine = {
  label: string;
  value: number;
  status: FilingLineStatus;
  source?: string;
  remarks?: string;
};

export type FilingSection = {
  key: string;
  title: string;
  lines: FilingLine[];
};

export const filingSections: FilingSection[] = [
  {
    key: "property",
    title: "Property",
    lines: [
      { label: "Residential Property — DHA Phase 6, Karachi", value: 49_950_000, status: "auto", source: "From Property" },
      { label: "Residential Property — E-11, Islamabad", value: 24_505_000, status: "auto", source: "From Property" },
      { label: "Agricultural Property", value: 0, status: "needs-input", remarks: "Not tracked in Lime — enter manually if applicable" },
      { label: "Commercial / Industrial Property", value: 0, status: "needs-input" },
    ],
  },
  {
    key: "investments",
    title: "Investments",
    lines: [
      { label: "Bank Accounts — Current & Savings", value: 898_200, status: "auto", source: "From Bank Accounts" },
      { label: "Bank Accounts — Fixed Deposit", value: 500_000, status: "auto", source: "From Bank Accounts" },
      { label: "Bonds & Certificates", value: 350_000, status: "auto", source: "From Others" },
      { label: "Stocks / Shares", value: 2_612_000, status: "auto", source: "From Stocks" },
      { label: "Mutual Fund Units", value: 216_000, status: "auto", source: "From Mutual Funds" },
      { label: "Crypto / Virtual Assets", value: 486_500, status: "auto", source: "From Crypto" },
    ],
  },
  {
    key: "vehicle",
    title: "Motor Vehicle",
    lines: [
      { label: "Honda Civic 2021", value: 4_450_000, status: "auto", source: "From Vehicle" },
      { label: "Honda City 2023", value: 3_780_000, status: "auto", source: "From Vehicle" },
    ],
  },
  {
    key: "precious",
    title: "Precious Possessions",
    lines: [
      { label: "Gold Jewelry & Bars", value: 3_622_500, status: "auto", source: "From Gold" },
    ],
  },
  {
    key: "other",
    title: "Any Other Asset",
    lines: [
      { label: "National Savings Certificate", value: 350_000, status: "auto", source: "From Others" },
      { label: "Business Capital / Assets", value: 0, status: "needs-input", remarks: "Sole proprietorship capital not tracked — please confirm with accountant" },
    ],
  },
  {
    key: "liabilities",
    title: "Liabilities / Credit",
    lines: [
      { label: "Auto Loan — HBL", value: 1_240_000, status: "auto", source: "From Loans" },
      { label: "Credit Card Outstanding", value: 105_800, status: "auto", source: "From Credit Cards" },
      { label: "BNPL Installments", value: 32_000, status: "auto", source: "From BNPL" },
      { label: "Mortgages / Advances", value: 0, status: "needs-input" },
    ],
  },
];

export const reconciliation = {
  netAssetsThisYear: 88_900_000,
  netAssetsLastYear: 79_400_000,
  inflows: [
    { label: "Salary Income (after tax)", value: 7_200_000 },
    { label: "Dividend Income", value: 285_000 },
    { label: "Capital Gains (Stocks & MF)", value: 640_000 },
  ],
  outflows: [
    { label: "Personal & Household Expenses", value: 3_450_000 },
    { label: "Loan Repayments", value: 822_000 },
    { label: "Zakat & Donations", value: 180_000 },
    { label: "Travel & Other", value: 573_000 },
  ],
};

export type FilerImpactRow = {
  category: string;
  filerCost: number;
  nonFilerCost: number;
  note: string;
};

export const filerImpactRows: FilerImpactRow[] = [
  { category: "Withholding Tax — Banking Transactions (cash withdrawal)", filerCost: 0, nonFilerCost: 42_000, note: "0.6% on cash withdrawals above Rs 50,000/day for non-filers" },
  { category: "Property Transfer Tax (if sold this year)", filerCost: 495_000, nonFilerCost: 1_485_000, note: "3% (filer) vs 10% (non-filer) advance tax under Sec 236C/236K" },
  { category: "Vehicle Registration / Transfer Tax", filerCost: 45_000, nonFilerCost: 135_000, note: "Advance tax at registration, higher slab for non-filers" },
  { category: "Dividend Withholding Tax", filerCost: 42_750, nonFilerCost: 85_500, note: "15% (filer) vs 30% (non-filer) on dividend income" },
  { category: "Profit on Debt (bank profit) Withholding", filerCost: 75_000, nonFilerCost: 150_000, note: "15% (filer) vs 30% (non-filer) on savings/FD profit" },
  { category: "Vehicle Token Tax (annual)", filerCost: 18_000, nonFilerCost: 36_000, note: "Doubled rate for non-filers under Finance Act provisions" },
];

export const totalFilerSavings = filerImpactRows.reduce((s, r) => s + (r.nonFilerCost - r.filerCost), 0);

export type FilingHistoryEntry = {
  year: string;
  status: "Filed" | "Late" | "Not Filed";
  filedDate?: string;
};

export const filingHistory: FilingHistoryEntry[] = [
  { year: "Tax Year 2025", status: "Filed", filedDate: "2025-09-22" },
  { year: "Tax Year 2024", status: "Filed", filedDate: "2024-09-18" },
  { year: "Tax Year 2023", status: "Late", filedDate: "2023-11-30" },
  { year: "Tax Year 2022", status: "Filed", filedDate: "2022-09-25" },
  { year: "Tax Year 2021", status: "Not Filed" },
];

export const taxMeta = {
  taxYear: "Tax Year 2026",
  deadline: "2026-09-30",
  filerStatus: "Filer" as "Filer" | "Non-Filer" | "Late Filer",
  submissionStatus: "Draft" as "Draft" | "Under Review" | "Filed",
};
