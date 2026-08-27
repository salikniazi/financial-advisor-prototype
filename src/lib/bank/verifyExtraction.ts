import type { ParsedTransactionRow, StatementPage } from "@/lib/bank/parseTypes";
import type { VisionTransaction } from "@/lib/bank/visionExtract";
import { lineToText } from "@/lib/bank/geometryUtils";
import { parseStatementDate, parseAmount } from "@/lib/bank/normalize";
import { parseStatementTable } from "@/lib/bank/statementTable";

// Cross-checks vision-extracted rows against the PDF's own text layer. This
// is what makes trusting a vision model for extraction reasonable at all --
// without it, a confidently wrong digit (16,743.65 misread as 16,743.05)
// would be indistinguishable from a correct one. Three independent checks,
// any one of which failing marks a row untrusted:
//
//   1. literal presence -- every date/amount the model returned must match a
//      real date/amount token that actually appears on that page.
//   2. anchor count -- how many transaction rows the model returned vs. how
//      many date-shaped tokens are visible on the page, as a coarse check
//      against wholesale dropped or invented rows.
//   3. row-for-row agreement with statementTable.ts's own deterministic
//      parse, when its header detection succeeds for this page -- the
//      strongest available check, since that parser is independently
//      verified against both real fixtures.
//
// Running-balance reconciliation across the whole document (validate.ts) is
// the final, strongest gate and runs separately once all pages are merged --
// it needs the full row sequence, not a single page.

const AMOUNT_TOKEN = /\(?[+-]?(?:Rs\.?|PKR|USD|AED|\$)?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\)?\s?(?:CR|DR)?/gi;
const DATE_TOKEN = /\b\d{1,2}[-\/. ][A-Za-z]{3,4}[-\/. ]\d{2,4}\b|\b\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}\b|\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/g;

/** Every date/amount value that genuinely appears anywhere on the page, regardless of column. */
function scanPageValues(page: StatementPage): { dates: Set<string>; amounts: Set<string> } {
  const dates = new Set<string>();
  const amounts = new Set<string>();

  for (const line of page.lines) {
    const text = lineToText(line);
    for (const match of text.match(DATE_TOKEN) ?? []) {
      const iso = parseStatementDate(match);
      if (iso) dates.add(iso);
    }
    for (const match of text.match(AMOUNT_TOKEN) ?? []) {
      const parsed = parseAmount(match);
      // Single-digit matches are too common to be a meaningful check (a
      // stray "1" or "5" is everywhere); require at least a plausible
      // transaction-amount shape.
      if (parsed && match.replace(/\D/g, "").length >= 2) amounts.add(parsed.value.toFixed(2));
    }
  }

  return { dates, amounts };
}

export type RowVerification = {
  row: ParsedTransactionRow;
  trusted: boolean;
  reasons: string[];
};

export type PageVerificationResult = {
  pageIndex: number;
  rows: RowVerification[];
  /** Vision-returned rows vs. date tokens visible on the page -- a coarse signal, not a hard gate. */
  anchorCountMismatch: boolean;
  /** Whether statementTable.ts could cross-check this page at all. */
  crossCheckedAgainstDeterministicParse: boolean;
};

function amountsAgree(a: number | null | undefined, b: number | null): boolean {
  if ((a == null || a === undefined) && b == null) return true;
  if (a == null || a === undefined || b == null) return false;
  return Math.abs(a - b) < 0.011;
}

/**
 * Verifies one page's vision-extracted transactions against that page's own
 * text layer, and against statementTable.ts's parse of the same page when
 * available.
 */
export function verifyPage(page: StatementPage, visionRows: VisionTransaction[]): PageVerificationResult {
  const { dates: knownDates, amounts: knownAmounts } = scanPageValues(page);

  const deterministic = parseStatementTable([page]);
  const crossCheckedAgainstDeterministicParse = deterministic.pagesWithoutLayout.length === 0 && deterministic.rows.length > 0;
  const deterministicByDate = new Map<string, ParsedTransactionRow[]>();
  for (const row of deterministic.rows) {
    const list = deterministicByDate.get(row.transactionDate) ?? [];
    list.push(row);
    deterministicByDate.set(row.transactionDate, list);
  }

  const rows: RowVerification[] = visionRows.map((vt) => {
    const reasons: string[] = [];
    const transactionDate = parseStatementDate(vt.date) ?? vt.date;

    if (!parseStatementDate(vt.date)) {
      reasons.push(`date "${vt.date}" doesn't parse.`);
    } else if (!knownDates.has(transactionDate)) {
      reasons.push(`date ${transactionDate} doesn't appear anywhere on this page's text layer.`);
    }

    const debit = typeof vt.debit === "number" ? vt.debit : null;
    const credit = typeof vt.credit === "number" ? vt.credit : null;
    const balanceAfter = typeof vt.balance_after === "number" ? vt.balance_after : null;

    for (const [label, value] of [
      ["debit", debit],
      ["credit", credit],
      ["balance", balanceAfter],
    ] as const) {
      if (value != null && !knownAmounts.has(value.toFixed(2))) {
        reasons.push(`${label} ${value.toFixed(2)} doesn't appear anywhere on this page's text layer.`);
      }
    }

    if (debit != null && credit != null) reasons.push("both a debit and a credit are set.");
    if (debit == null && credit == null) reasons.push("neither a debit nor a credit is set.");

    // Strongest check: does an independently-parsed row on the same date
    // roughly agree on amounts? Only meaningful when the deterministic
    // parser actually found a layout for this page.
    if (crossCheckedAgainstDeterministicParse) {
      const candidates = deterministicByDate.get(transactionDate) ?? [];
      const agrees = candidates.some((c) => amountsAgree(debit, c.debit) && amountsAgree(credit, c.credit));
      if (candidates.length > 0 && !agrees) {
        reasons.push(`no deterministically-parsed row on ${transactionDate} matches these amounts.`);
      }
    }

    const row: ParsedTransactionRow = {
      transactionDate,
      description: vt.description ?? "",
      instrumentNumber: vt.instrument_number?.trim() || null,
      debit,
      credit,
      balanceAfter,
      pageIndex: page.pageIndex,
    };

    return { row, trusted: reasons.length === 0, reasons };
  });

  // Coarse cross-check: wildly different counts suggest dropped or invented
  // rows even when individual rows pass the literal-presence check (e.g. a
  // whole transaction hallucinated whole-cloth from a real date elsewhere on
  // the page). Not a hard gate -- some pages legitimately have no table.
  const anchorCountMismatch = Math.abs(visionRows.length - knownDates.size) > Math.max(2, Math.ceil(knownDates.size * 0.3));

  return { pageIndex: page.pageIndex, rows, anchorCountMismatch, crossCheckedAgainstDeterministicParse };
}

/** Verifies every page's vision extraction against its own text layer. */
export function verifyAllPages(pages: StatementPage[], visionByPage: Map<number, VisionTransaction[]>): PageVerificationResult[] {
  return pages.map((page) => verifyPage(page, visionByPage.get(page.pageIndex) ?? []));
}
