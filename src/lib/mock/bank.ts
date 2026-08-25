import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export const bankAccounts = [
  { bank: "Meezan Bank", type: "Current Account", balance: 285_400 },
  { bank: "HBL", type: "Savings Account", balance: 612_800 },
  { bank: "UBL", type: "Fixed Deposit (6mo)", balance: 500_000 },
];

export const bankTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);
export const bankHistory = buildTrendSeries(months, bankTotal, 0.08, 0.04, 71);

export const loans = [
  { lender: "HBL", type: "Auto Loan (Civic 2021)", outstanding: 1_240_000, monthlyPayment: 68_500 },
];
export const loansTotal = loans.reduce((s, l) => s + l.outstanding, 0);
export const loansHistory = buildTrendSeries(months, loansTotal, -0.22, 0.01, 72);

export const creditCards = [
  { bank: "Standard Chartered", card: "Platinum Visa", outstanding: 84_200, limit: 500_000 },
  { bank: "Meezan Bank", card: "Meezan Clarity Visa", outstanding: 21_600, limit: 300_000 },
];
export const creditCardsTotal = creditCards.reduce((s, c) => s + c.outstanding, 0);
export const creditCardsHistory = buildTrendSeries(months, creditCardsTotal, 0.15, 0.12, 73);

export const bnpl = [
  { merchant: "QistPay - Daraz", item: "Samsung Galaxy S25", outstanding: 32_000, installmentsLeft: 4 },
];
export const bnplTotal = bnpl.reduce((s, b) => s + b.outstanding, 0);
export const bnplHistory = buildTrendSeries(months, bnplTotal, -0.35, 0.05, 74);
