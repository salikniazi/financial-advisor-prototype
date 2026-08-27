import type { ParsedTransactionRow, StatementFacts } from "@/lib/bank/parseTypes";

// Arithmetic cross-checks on parsed rows. This is what makes deterministic
// parsing trustworthy enough to skip an LLM extraction pass: when a statement
// prints a running balance it is handing us a per-row checksum, and
// reconciling against it proves the parse rather than hoping it's right.
//
// Nothing here mutates rows -- it reports, and the caller decides whether to
// send the affected pages off for repair.

// Currency comparison tolerance. Statements are 2dp; anything under a paisa
// is float noise, anything above is a real disagreement.
const EPSILON = 0.011;

export type RowIssueCode =
  | "unbalanced" // running balance doesn't follow from the previous row
  | "no_amount" // neither debit nor credit
  | "both_amounts" // both debit and credit set
  | "date_out_of_period"
  | "date_regression"; // dates went backwards

// "hard" issues mean the row itself is wrong -- they gate the parse, target
// the LLM repair path, and block a layout profile from being cached (see
// bank_statement_layouts). "soft" issues are statement-level oddities that
// don't mean the row was misparsed: value-date/posting-date splits and
// cheque-clearing batches routinely put dates out of strict order on a
// completely correctly-transcribed statement. Treating those as hard would
// discard a good cached layout profile and send correct rows to repair on
// every statement that isn't strictly chronological.
const HARD_ISSUE_CODES: ReadonlySet<RowIssueCode> = new Set(["unbalanced", "no_amount", "both_amounts"]);

function isHardIssue(code: RowIssueCode): boolean {
  return HARD_ISSUE_CODES.has(code);
}

export type RowIssue = {
  rowIndex: number;
  pageIndex: number;
  code: RowIssueCode;
  detail: string;
};

export type ValidationReport = {
  /** True when there are no *hard* issues. Soft issues (see `warnings`) never affect this. */
  ok: boolean;
  /** True when the statement printed balances and we were able to check them. */
  runningBalanceChecked: boolean;
  /** Hard issues only -- these are what gate the parse and target repair. */
  issues: RowIssue[];
  /** Soft issues -- surfaced to the review UI, never gate anything. */
  warnings: RowIssue[];
  /** Distinct pages containing at least one hard issue -- the repair path's targets. */
  pagesWithIssues: number[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    openingBalance: number | null;
    closingBalance: number | null;
    /** opening + credits - debits, when an opening balance is known. */
    computedClosing: number | null;
    /** Whether computedClosing matches the statement's stated closing. */
    closingReconciles: boolean | null;
  };
};

function signedAmount(row: ParsedTransactionRow): number {
  return (row.credit ?? 0) - (row.debit ?? 0);
}

const ISSUE_LABEL: Record<RowIssueCode, (n: number) => string> = {
  unbalanced: (n) => `${n} row${n === 1 ? "" : "s"} didn't match the running balance`,
  no_amount: (n) => `${n} row${n === 1 ? "" : "s"} with no amount`,
  both_amounts: (n) => `${n} row${n === 1 ? "" : "s"} with both a debit and a credit`,
  date_out_of_period: (n) => `${n} date${n === 1 ? "" : "s"} outside the statement period`,
  date_regression: (n) => `${n} out-of-order date${n === 1 ? "" : "s"}`,
};

function summarizeIssues(issues: RowIssue[]): string {
  const counts = new Map<RowIssueCode, number>();
  for (const issue of issues) {
    counts.set(issue.code, (counts.get(issue.code) ?? 0) + 1);
  }
  return [...counts.entries()].map(([code, n]) => ISSUE_LABEL[code](n)).join("; ");
}

/** Human-readable one-liner for the import record / review UI. */
export function summarizeValidation(report: ValidationReport): string {
  const warningSuffix = report.warnings.length > 0 ? ` (${summarizeIssues(report.warnings)}.)` : "";
  if (report.ok) {
    const base = report.runningBalanceChecked
      ? "Every row reconciles against the statement's running balance."
      : "Parsed cleanly. This statement prints no running balance, so per-row balances weren't verifiable.";
    return `${base}${warningSuffix}`;
  }
  return `${summarizeIssues(report.issues)}.${warningSuffix}`;
}

/**
 * Validates parsed rows against each other and against the statement's own
 * stated figures. Rows are expected in document order.
 */
export function validateRows(rows: ParsedTransactionRow[], facts: StatementFacts): ValidationReport {
  // Collected together during the row-by-row pass (issue order matters for
  // page targeting) and split into `issues`/`warnings` by severity below.
  const allIssues: RowIssue[] = [];
  const push = (issue: RowIssue) => allIssues.push(issue);

  let totalDebits = 0;
  let totalCredits = 0;
  let previousBalance: number | null = facts.openingBalance;
  let previousDate: string | null = null;
  let checkedAnyBalance = false;

  rows.forEach((row, rowIndex) => {
    totalDebits += row.debit ?? 0;
    totalCredits += row.credit ?? 0;

    if (row.debit == null && row.credit == null) {
      push({ rowIndex, pageIndex: row.pageIndex, code: "no_amount", detail: "Row has neither a debit nor a credit." });
    } else if (row.debit != null && row.credit != null) {
      push({
        rowIndex,
        pageIndex: row.pageIndex,
        code: "both_amounts",
        detail: `Row has both a debit (${row.debit}) and a credit (${row.credit}).`,
      });
    }

    // Running balance: the checksum the statement gives us for free.
    if (row.balanceAfter != null) {
      if (previousBalance != null) {
        const expected = previousBalance + signedAmount(row);
        if (Math.abs(expected - row.balanceAfter) > EPSILON) {
          push({
            rowIndex,
            pageIndex: row.pageIndex,
            code: "unbalanced",
            detail: `Expected ${expected.toFixed(2)} (${previousBalance.toFixed(2)} ${signedAmount(row) < 0 ? "-" : "+"} ${Math.abs(signedAmount(row)).toFixed(2)}) but the statement shows ${row.balanceAfter.toFixed(2)}.`,
          });
        } else {
          checkedAnyBalance = true;
        }
      }
      previousBalance = row.balanceAfter;
    }

    if (facts.periodStart && row.transactionDate < facts.periodStart) {
      push({
        rowIndex,
        pageIndex: row.pageIndex,
        code: "date_out_of_period",
        detail: `${row.transactionDate} falls before the statement period start (${facts.periodStart}).`,
      });
    }
    if (facts.periodEnd && row.transactionDate > facts.periodEnd) {
      push({
        rowIndex,
        pageIndex: row.pageIndex,
        code: "date_out_of_period",
        detail: `${row.transactionDate} falls after the statement period end (${facts.periodEnd}).`,
      });
    }

    // Statements aren't always in strict date order (value date vs. posting
    // date, cheque-clearing batches), so this is a warning, not proof the row
    // was misparsed -- see the hard/soft split above.
    if (previousDate && row.transactionDate < previousDate) {
      push({
        rowIndex,
        pageIndex: row.pageIndex,
        code: "date_regression",
        detail: `${row.transactionDate} comes after ${previousDate} in the document but is an earlier date.`,
      });
    }
    previousDate = row.transactionDate;
  });

  const computedClosing = facts.openingBalance != null ? facts.openingBalance + totalCredits - totalDebits : null;
  const closingReconciles =
    computedClosing != null && facts.closingBalance != null ? Math.abs(computedClosing - facts.closingBalance) <= EPSILON : null;

  const issues = allIssues.filter((i) => isHardIssue(i.code));
  const warnings = allIssues.filter((i) => !isHardIssue(i.code));
  const pagesWithIssues = [...new Set(issues.map((i) => i.pageIndex))].sort((a, b) => a - b);

  return {
    // A failed opening/closing reconciliation is reported but doesn't by
    // itself fail the parse: plenty of statements print neither figure, and
    // some print a closing balance that includes holds/uncleared items we
    // never saw as rows. Per-row balance disagreements are the hard signal.
    //
    // Only *hard* issues gate this -- date-order oddities (soft issues) are
    // reported via `warnings` but never fail an otherwise-correct parse. See
    // the hard/soft split above.
    ok: issues.length === 0,
    runningBalanceChecked: checkedAnyBalance,
    issues,
    warnings,
    pagesWithIssues,
    totals: {
      totalDebits,
      totalCredits,
      openingBalance: facts.openingBalance,
      closingBalance: facts.closingBalance,
      computedClosing,
      closingReconciles,
    },
  };
}
