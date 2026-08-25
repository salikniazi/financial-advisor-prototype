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
      { label: "Residential Property", value: 0, status: "needs-input", remarks: "No property on file yet" },
      { label: "Agricultural Property", value: 0, status: "needs-input", remarks: "Not tracked in Lime — enter manually if applicable" },
      { label: "Commercial / Industrial Property", value: 0, status: "needs-input" },
    ],
  },
  {
    key: "investments",
    title: "Investments",
    lines: [
      { label: "Bank Accounts — Current & Savings", value: 0, status: "needs-input" },
      { label: "Bank Accounts — Fixed Deposit", value: 0, status: "needs-input" },
      { label: "Bonds & Certificates", value: 0, status: "needs-input" },
      { label: "Stocks / Shares", value: 0, status: "needs-input" },
      { label: "Mutual Fund Units", value: 0, status: "needs-input" },
      { label: "Crypto / Virtual Assets", value: 0, status: "needs-input" },
    ],
  },
  {
    key: "vehicle",
    title: "Motor Vehicle",
    lines: [{ label: "No vehicle on file yet", value: 0, status: "needs-input" }],
  },
  {
    key: "precious",
    title: "Precious Possessions",
    lines: [{ label: "Gold Jewelry & Bars", value: 0, status: "needs-input" }],
  },
  {
    key: "other",
    title: "Any Other Asset",
    lines: [
      { label: "National Savings Certificate", value: 0, status: "needs-input" },
      { label: "Business Capital / Assets", value: 0, status: "needs-input", remarks: "Sole proprietorship capital not tracked — please confirm with accountant" },
    ],
  },
  {
    key: "liabilities",
    title: "Liabilities / Credit",
    lines: [
      { label: "Auto Loan", value: 0, status: "needs-input" },
      { label: "Credit Card Outstanding", value: 0, status: "needs-input" },
      { label: "BNPL Installments", value: 0, status: "needs-input" },
      { label: "Mortgages / Advances", value: 0, status: "needs-input" },
    ],
  },
];

export const reconciliation = {
  netAssetsThisYear: 0,
  netAssetsLastYear: 0,
  inflows: [] as { label: string; value: number }[],
  outflows: [] as { label: string; value: number }[],
};

export type FilerImpactRow = {
  category: string;
  filerCost: number;
  nonFilerCost: number;
  note: string;
};

export const filerImpactRows: FilerImpactRow[] = [
  { category: "Withholding Tax — Banking Transactions (cash withdrawal)", filerCost: 0, nonFilerCost: 0, note: "0.6% on cash withdrawals above Rs 50,000/day for non-filers" },
  { category: "Property Transfer Tax (if sold this year)", filerCost: 0, nonFilerCost: 0, note: "3% (filer) vs 10% (non-filer) advance tax under Sec 236C/236K" },
  { category: "Vehicle Registration / Transfer Tax", filerCost: 0, nonFilerCost: 0, note: "Advance tax at registration, higher slab for non-filers" },
  { category: "Dividend Withholding Tax", filerCost: 0, nonFilerCost: 0, note: "15% (filer) vs 30% (non-filer) on dividend income" },
  { category: "Profit on Debt (bank profit) Withholding", filerCost: 0, nonFilerCost: 0, note: "15% (filer) vs 30% (non-filer) on savings/FD profit" },
  { category: "Vehicle Token Tax (annual)", filerCost: 0, nonFilerCost: 0, note: "Doubled rate for non-filers under Finance Act provisions" },
];

export const totalFilerSavings = filerImpactRows.reduce((s, r) => s + (r.nonFilerCost - r.filerCost), 0);

export type FilingHistoryEntry = {
  year: string;
  status: "Filed" | "Late" | "Not Filed";
  filedDate?: string;
};

export const filingHistory: FilingHistoryEntry[] = [];

export const taxMeta = {
  taxYear: "Tax Year 2026",
  deadline: "2026-09-30",
  filerStatus: "Non-Filer" as "Filer" | "Non-Filer" | "Late Filer",
  submissionStatus: "Draft" as "Draft" | "Under Review" | "Filed",
};
