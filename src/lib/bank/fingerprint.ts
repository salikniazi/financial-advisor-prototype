import "server-only";
import { createHash } from "crypto";

// Trimmed, lowercased, whitespace-collapsed -- so two extractions of the same
// row don't produce different fingerprints over trivial formatting noise.
function normalizeDescription(description: string): string {
  return description.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Deterministic dedup key for a transaction, matching the
 * `unique (account_id, fingerprint)` constraint on bank_transactions.
 * A re-import of the same statement (or an overlapping one) produces the
 * same fingerprint for the same real-world transaction.
 *
 * `occurrenceIndex` (0-based) breaks ties when two rows in the same batch
 * would otherwise produce an identical fingerprint -- two genuinely distinct
 * transactions on the same day, for the same amount, with the same
 * description (e.g. two identical ATM withdrawals). Without it the second
 * row's insert is silently swallowed by the unique constraint, which reads
 * as a duplicate-import rather than what it actually is: two real rows
 * colliding onto one key.
 *
 * Known limitation, worth having in the code rather than only in review
 * history: the index is the row's position within its duplicate group *in
 * this batch*, which is only stable when a statement is re-imported whole.
 * It breaks under a partial overlap -- if statement 1 (Jan-Mar) has two
 * identical rows (occurrence 0 and 1) and statement 2 (Feb-Apr) contains
 * only the later one, that row computes occurrence 0 in its own batch,
 * collides with statement 1's occurrence-0 row, and is silently dropped as
 * a duplicate. Exact duplicate *groups* are rare, and a partial-overlap
 * re-import containing only one of them is rarer still, so this is an
 * accepted trade against the alternative -- dropping a genuine duplicate
 * pair on every single-statement import, which would happen every time.
 */
export function computeTransactionFingerprint(input: {
  accountId: string;
  transactionDate: string; // YYYY-MM-DD
  debit: number | null;
  credit: number | null;
  description: string;
  occurrenceIndex?: number;
}): string {
  const parts = [
    input.accountId,
    input.transactionDate,
    input.debit != null ? input.debit.toFixed(2) : "",
    input.credit != null ? input.credit.toFixed(2) : "",
    normalizeDescription(input.description),
    String(input.occurrenceIndex ?? 0),
  ].join("|");
  return createHash("sha256").update(parts).digest("hex");
}

/**
 * Computes a stable occurrence index for every row in a batch: 0 for the
 * first row that shares its (date, debit, credit, description) with no
 * earlier row, 1 for the second identical row, and so on. Call this over an
 * entire statement's rows before fingerprinting, in document order.
 */
export function assignOccurrenceIndexes<T extends { transactionDate: string; debit: number | null; credit: number | null; description: string }>(
  rows: T[]
): number[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const key = [row.transactionDate, row.debit != null ? row.debit.toFixed(2) : "", row.credit != null ? row.credit.toFixed(2) : "", normalizeDescription(row.description)].join(
      "|"
    );
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count;
  });
}
