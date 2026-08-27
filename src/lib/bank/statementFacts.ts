import type { ParsedTransactionRow, StatementFacts, StatementPage } from "@/lib/bank/parseTypes";
import { lineToText } from "@/lib/bank/geometryUtils";
import { parseStatementDate, parseAmount } from "@/lib/bank/normalize";
import { parseStatementTable } from "@/lib/bank/statementTable";

// Statement-level facts, derived deterministically from the PDF's own text --
// never asked of an LLM. This was one of the three original failure modes:
// the old metadata pass returned opening_balance as 18,213.64, then 0, then
// 194,132.23 across three runs of the same file. A regex scan of the same
// text produces the same answer every time.
//
// Two independent sources for opening/closing balance, since the two real
// fixtures print it differently: UBL states it as a table row ("**Opening
// Balance" with 0/0 amount columns, picked up by statementTable.ts's own
// marker-row handling), Mashreq states it in a free-text header block
// ("Opening Balance   0.00"). Both are tried; the header-block scan below is
// the primary source, with the in-table marker as a fallback.

const DATE_TOKEN = /\b\d{1,2}[-\/. ][A-Za-z]{3,4}[-\/. ]\d{2,4}\b|\b\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}\b|\b\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}\b/g;
const AMOUNT_TOKEN = /\(?[+-]?(?:Rs\.?|PKR|USD|AED|\$)?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\)?/;

function firstAmountOnLine(text: string): number | null {
  const match = text.match(AMOUNT_TOKEN);
  return match ? (parseAmount(match[0])?.value ?? null) : null;
}

/** Scans free-form page text for a stated period, opening balance, and closing balance. */
function scanHeaderText(pages: StatementPage[]): { periodStart: string | null; periodEnd: string | null; opening: number | null; closing: number | null } {
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let opening: number | null = null;
  let closing: number | null = null;

  for (const page of pages) {
    for (const line of page.lines) {
      const text = lineToText(line);

      // The label must sit at (or very near) the start of the line -- a
      // genuine header block is just "Opening Balance   0.00", nothing
      // else. Without this, a table row that happens to *contain* the
      // words "Opening Balance" among other columns (UBL's marker row:
      // "22-Apr-2026  ** Opening Balance  0  0  18,213.64") matches too,
      // and the first amount found after stripping the label is whatever
      // came before it on the line -- the "22" off the date, not the real
      // balance. That case is handled correctly elsewhere, by
      // statementTable.ts's column-aware marker-row parsing (the fallback
      // below); this scan should stay out of its way rather than guess.
      const openingMatch = opening === null ? text.match(/^\W{0,3}opening\s*balance/i) : null;
      if (openingMatch) {
        opening = firstAmountOnLine(text.slice(openingMatch[0].length));
      }
      const closingMatch = closing === null ? text.match(/^\W{0,3}closing\s*balance/i) : null;
      if (closingMatch) {
        closing = firstAmountOnLine(text.slice(closingMatch[0].length));
      }

      // A period range: exactly two date-shaped tokens on one line. Real
      // statement rows only ever carry one date each, so this is specific
      // enough without requiring a "period" label -- UBL's period line
      // ("22-Apr-2026 - 22-Jul-2026") carries no such label at all.
      if (periodStart === null || periodEnd === null) {
        const tokens = text.match(DATE_TOKEN) ?? [];
        if (tokens.length === 2) {
          const [a, b] = tokens.map(parseStatementDate);
          if (a && b) {
            periodStart = a < b ? a : b;
            periodEnd = a < b ? b : a;
          }
        }
      }
    }
  }

  return { periodStart, periodEnd, opening, closing };
}

/**
 * Derives every StatementFacts field from the document itself: the header
 * text scan above, falling back to statementTable.ts's in-table
 * opening-balance marker, falling back to the final row set's own date
 * range and running-balance presence.
 */
export function deriveStatementFacts(pages: StatementPage[], rows: ParsedTransactionRow[]): StatementFacts {
  const scanned = scanHeaderText(pages);

  // Fallback source for opening balance: a marker row detected during
  // deterministic table parsing (UBL's convention). Only consulted if the
  // free-text scan found nothing.
  const openingBalance = scanned.opening ?? parseStatementTable(pages).openingBalance;

  const dates = rows.map((r) => r.transactionDate).filter(Boolean).sort();
  const periodStart = scanned.periodStart ?? dates[0] ?? null;
  const periodEnd = scanned.periodEnd ?? dates[dates.length - 1] ?? null;

  const hasRunningBalance = rows.some((r) => r.balanceAfter != null);

  return {
    periodStart,
    periodEnd,
    hasRunningBalance,
    openingBalance,
    closingBalance: scanned.closing,
  };
}
