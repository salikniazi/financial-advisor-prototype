import { buildTrendSeries, lastMonths } from "./months";

const months = lastMonths(12);

export const bankAccounts: { bank: string; type: string; balance: number }[] = [];

export const bankTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);
export const bankHistory = buildTrendSeries(months, bankTotal, 0.08, 0.04, 71);

export const loans: { lender: string; type: string; outstanding: number; monthlyPayment: number }[] = [];
export const loansTotal = loans.reduce((s, l) => s + l.outstanding, 0);
export const loansHistory = buildTrendSeries(months, loansTotal, -0.22, 0.01, 72);

export const creditCards: { bank: string; card: string; outstanding: number; limit: number }[] = [];
export const creditCardsTotal = creditCards.reduce((s, c) => s + c.outstanding, 0);
export const creditCardsHistory = buildTrendSeries(months, creditCardsTotal, 0.15, 0.12, 73);

export const bnpl: { merchant: string; item: string; outstanding: number; installmentsLeft: number }[] = [];
export const bnplTotal = bnpl.reduce((s, b) => s + b.outstanding, 0);
export const bnplHistory = buildTrendSeries(months, bnplTotal, -0.35, 0.05, 74);
