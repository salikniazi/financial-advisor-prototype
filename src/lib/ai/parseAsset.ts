export type ParsedAsset = {
  name: string;
  type: string;
  currentValue: number;
  fields: Record<string, string>;
};

const templates: { keywords: RegExp; result: ParsedAsset }[] = [
  {
    keywords: /(fixed deposit|\bfd\b|term deposit)/i,
    result: {
      name: "Bank Islami Term Deposit",
      type: "Fixed Deposit",
      currentValue: 620_000,
      fields: {
        Institution: "Bank Islami Pakistan",
        "Principal Amount": "Rs 580,000",
        "Interest Rate": "12.75% p.a.",
        "Maturity Date": "10 Mar 2027",
        "Current Value (with accrued profit)": "Rs 620,000",
      },
    },
  },
  {
    keywords: /(national savings|nsc|savings certificate|prize bond)/i,
    result: {
      name: "Regular Income Certificate",
      type: "National Savings Certificate",
      currentValue: 410_000,
      fields: {
        Issuer: "Central Directorate of National Savings",
        "Face Value": "Rs 400,000",
        "Profit Rate": "13.2% p.a.",
        "Maturity Date": "18 Jan 2029",
        "Current Value": "Rs 410,000",
      },
    },
  },
  {
    keywords: /(provident|gratuity|pf\b)/i,
    result: {
      name: "Employer Provident Fund",
      type: "Provident Fund",
      currentValue: 1_240_000,
      fields: {
        Administrator: "Trustee Board — Employer PF Trust",
        "Employee Contribution": "Rs 520,000",
        "Employer Contribution": "Rs 520,000",
        "Accrued Profit": "Rs 200,000",
        "Current Value": "Rs 1,240,000",
      },
    },
  },
];

const fallback: ParsedAsset = {
  name: "Meezan Bank Term Certificate",
  type: "Fixed Deposit",
  currentValue: 500_000,
  fields: {
    Institution: "Meezan Bank",
    "Principal Amount": "Rs 470,000",
    "Profit Rate": "12.4% p.a. (Islamic Mudarabah)",
    "Maturity Date": "05 Nov 2026",
    "Current Value (with accrued profit)": "Rs 500,000",
  },
};

export function mockParseAsset(input: string): ParsedAsset {
  const match = templates.find((t) => t.keywords.test(input));
  return match ? match.result : fallback;
}
