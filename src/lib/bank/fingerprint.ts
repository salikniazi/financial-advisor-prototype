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
 */
export function computeTransactionFingerprint(input: {
  accountId: string;
  transactionDate: string; // YYYY-MM-DD
  debit: number | null;
  credit: number | null;
  description: string;
}): string {
  const parts = [
    input.accountId,
    input.transactionDate,
    input.debit != null ? input.debit.toFixed(2) : "",
    input.credit != null ? input.credit.toFixed(2) : "",
    normalizeDescription(input.description),
  ].join("|");
  return createHash("sha256").update(parts).digest("hex");
}
