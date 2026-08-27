// Parsing of the raw strings pulled off a statement's page geometry into the
// types the rest of the pipeline works in. Deliberately strict: an
// unparseable date returns null so the caller can flag the row, rather than
// being handed straight to a Postgres `date` cast where it fails the whole
// import.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Round-trip through Date to reject things like 31 February.
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function expandYear(raw: string): number {
  const n = Number(raw);
  if (raw.length === 4) return n;
  // Two-digit years on a bank statement are overwhelmingly recent.
  return n <= 69 ? 2000 + n : 1900 + n;
}

/**
 * Parses the date formats seen on Pakistani bank statements into ISO
 * YYYY-MM-DD. Returns null when the text isn't a date at all -- callers use
 * that to distinguish a transaction's first line from its continuation lines.
 *
 * Day-first is assumed for all-numeric forms (DD/MM/YYYY), which is the
 * convention in PK. An ISO-looking YYYY-MM-DD is detected by shape first, so
 * it is never misread as day-first.
 */
export function parseStatementDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  // YYYY-MM-DD / YYYY/MM/DD
  const isoLike = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoLike) return iso(Number(isoLike[1]), Number(isoLike[2]), Number(isoLike[3]));

  // DD-MMM-YYYY / DD MMM YY / DD-MMM-YY  (e.g. 12-APR-2025, 04 Jul 2026)
  const named = text.match(/^(\d{1,2})[-\s/]([A-Za-z]{3,4})[-\s/](\d{2}|\d{4})$/);
  if (named) {
    const month = MONTHS[named[2].toLowerCase()];
    if (!month) return null;
    return iso(expandYear(named[3]), month, Number(named[1]));
  }

  // DD-MM-YYYY / DD/MM/YY (day-first)
  const numeric = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (numeric) {
    return iso(expandYear(numeric[3]), Number(numeric[2]), Number(numeric[1]));
  }

  return null;
}

export type ParsedAmount = { value: number; isCredit: boolean | null };

/**
 * Parses an amount cell. Returns the magnitude plus an explicit
 * credit/debit signal when the cell itself carries one (a trailing CR/DR, or
 * parentheses/leading minus for negatives) -- otherwise `isCredit: null`,
 * meaning "the column this came from decides".
 *
 * Returns null for anything that isn't a number, so an empty cell and a
 * genuine zero stay distinguishable.
 */
export function parseAmount(raw: string): ParsedAmount | null {
  let text = raw.trim();
  if (!text) return null;

  let isCredit: boolean | null = null;

  // Trailing (or leading) CR/DR markers.
  const crdr = text.match(/^(?:(CR|DR)\s*)?(.*?)(?:\s*(CR|DR))?$/i);
  if (crdr) {
    const marker = (crdr[1] || crdr[3] || "").toUpperCase();
    if (marker === "CR") isCredit = true;
    else if (marker === "DR") isCredit = false;
    if (marker) text = crdr[2].trim();
  }

  // Parenthesised negatives, e.g. (1,234.56)
  let negated = false;
  const parenthesised = text.match(/^\((.*)\)$/);
  if (parenthesised) {
    negated = true;
    text = parenthesised[1].trim();
  }
  if (text.startsWith("-")) {
    negated = true;
    text = text.slice(1).trim();
  }
  if (text.startsWith("+")) text = text.slice(1).trim();

  // Strip currency symbols/codes and thousands separators.
  text = text.replace(/^(?:rs\.?|pkr|usd|aed|\$)\s*/i, "").replace(/,/g, "").trim();

  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;

  if (negated && isCredit === null) isCredit = false;
  return { value, isCredit };
}

/** True if a cell looks like an amount -- used to spot amount columns by shape. */
export function looksLikeAmount(raw: string): boolean {
  return parseAmount(raw) !== null;
}

/**
 * Joins a transaction's first line with its continuation lines into one
 * description, collapsing whitespace. Byte-stability matters here: this
 * string feeds the dedup fingerprint, so the same statement parsed twice must
 * produce the identical result.
 */
export function normalizeDescription(parts: string[]): string {
  return parts
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}
