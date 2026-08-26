// Fixed transaction category list, grouped for UI use (e.g. a grouped filter
// dropdown in Stage D). Mirrored exactly by the `bank_transactions_category_check`
// constraint in supabase/migrations/20260826120000_bank_statements.sql — keep
// both in sync if this list ever changes.

export type BankCategoryGroup = {
  group: string;
  categories: string[];
};

export const BANK_CATEGORY_GROUPS: BankCategoryGroup[] = [
  {
    group: "Income",
    categories: ["Salary / Payroll", "Business Income", "Dividends & Investment Returns", "Other Income"],
  },
  {
    group: "Transfers",
    categories: ["Personal Transfer", "Business Transfer"],
  },
  {
    group: "Cash Handling",
    categories: ["Cash Withdrawal", "Cash Deposit"],
  },
  {
    group: "Savings & Investments",
    categories: ["Investments — Stocks / Mutual Funds", "Fixed Deposit / Savings Instrument"],
  },
  {
    group: "Debt & Obligations",
    categories: ["Credit Card Payment", "Loan Repayment"],
  },
  {
    group: "Housing & Utilities",
    categories: ["Rent / Housing Payment", "Utilities & Bills"],
  },
  {
    group: "Everyday Spending",
    categories: [
      "Groceries",
      "Dining & Cafes",
      "Food Delivery",
      "Shopping & Retail",
      "Fuel",
      "Transport / Ride-hailing",
      "Travel",
      "Healthcare",
      "Fitness & Sports",
      "Education",
      "Entertainment",
      "Subscriptions",
      "Insurance",
      "Zakat & Donations",
    ],
  },
  {
    group: "Fees, Charges & Tax",
    categories: ["Bank Fees / Charges", "Tax / Withholding"],
  },
  {
    group: "Fallback",
    categories: ["Uncategorized"],
  },
];

// Flat list, in the same order — matches the SQL check constraint exactly.
export const BANK_CATEGORIES: string[] = BANK_CATEGORY_GROUPS.flatMap((g) => g.categories);
