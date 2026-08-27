import type { PageLine, StatementPage, ParsedTransactionRow } from "@/lib/bank/parseTypes";
import { lineToText, textInRange } from "@/lib/bank/geometryUtils";
import { parseStatementDate, parseAmount, normalizeDescription } from "@/lib/bank/normalize";

// Column detection and row assembly. This is the layer that turns positioned
// text into transactions without an LLM ever reading a row: columns come from
// whatever the statement's own header says, and rows come from the geometry.
//
// Nothing here is bank-specific. The two real statements it was built against
// (UBL, Mashreq) disagree on column order, amount sign convention, which cell
// is used for an unused amount, and whether description text wraps above or
// below its data line -- so anything that only worked for one of them was
// rejected rather than special-cased.

// Gap between the end of one run and the start of the next, in points, above
// which we treat them as separate labels rather than one word. Matches the
// column-gap notion in geometryUtils; header runs arrive heavily fragmented
// ("D","A","TE"), sometimes with slight negative gaps from kerning.
const LABEL_GAP = 8;

/** Header vocabulary, tested in this order so overlapping matches resolve predictably. */
const ROLE_PATTERNS: { role: ColumnRole; pattern: RegExp }[] = [
  // Anchored, so "Description" can't be swallowed by a loose /date/ match.
  { role: "date", pattern: /^(txn|transaction|value|posting|book)?\s*date$/i },
  { role: "description", pattern: /particular|description|narration|details|remarks/i },
  { role: "reference", pattern: /reference|inst\.?\s*no|cheque|chq/i },
  { role: "debit", pattern: /debit|withdrawal|dr\b|money out|paid out/i },
  { role: "credit", pattern: /credit|deposit|cr\b|money in|paid in/i },
  { role: "balance", pattern: /balance/i },
  // Only after debit/credit, so a "Debit Amount" header doesn't land here.
  { role: "amount", pattern: /^(amount|transaction amount|value)$/i },
];

export type ColumnRole = "date" | "description" | "reference" | "debit" | "credit" | "amount" | "balance";

export type DetectedColumn = { role: ColumnRole; range: [number, number] };

export type TableLayout = {
  /** Baseline of the header row; only lines below this are table content. */
  headerY: number;
  columns: DetectedColumn[];
};

export type TableParseResult = {
  rows: ParsedTransactionRow[];
  /**
   * Balance carried by an opening-balance marker row (a dated row whose amount
   * cells are all zero), when the statement prints one as a table row rather
   * than in a header block. Feeds StatementFacts.openingBalance.
   */
  openingBalance: number | null;
  /** Pages where no header could be found and none could be carried forward. */
  pagesWithoutLayout: number[];
};

type LabelGroup = { text: string; start: number };

/** Clusters a line's fragmented runs into whole labels, keeping each label's left edge. */
function toLabelGroups(line: PageLine): LabelGroup[] {
  const groups: LabelGroup[] = [];
  let current: { parts: string[]; start: number; end: number } | null = null;

  for (const item of line.items) {
    if (current && item.x - current.end <= LABEL_GAP) {
      current.parts.push(item.str);
      current.end = Math.max(current.end, item.x + item.width);
    } else {
      if (current) groups.push({ text: current.parts.join(""), start: current.start });
      current = { parts: [item.str], start: item.x, end: item.x + item.width };
    }
  }
  if (current) groups.push({ text: current.parts.join(""), start: current.start });

  return groups.map((g) => ({ text: g.text.replace(/\s+/g, " ").trim(), start: g.start })).filter((g) => g.text.length > 0);
}

function roleFor(label: string): ColumnRole | null {
  for (const { role, pattern } of ROLE_PATTERNS) {
    if (pattern.test(label)) return role;
  }
  return null;
}

/**
 * Finds the table header on a page by scoring every line against the column
 * vocabulary, and converts it into x-ranges.
 *
 * Ranges run from each column's own left edge to the *next* column's left edge
 * rather than to a midpoint between them. Midpoints seem tidier but break real
 * statements: UBL descriptions run well past the midpoint between PARTICULARS
 * and INST. NO., and would be cut in half.
 */
export function detectLayout(page: StatementPage): TableLayout | null {
  let best: { line: PageLine; groups: LabelGroup[]; roles: Map<ColumnRole, number>; score: number } | null = null;

  for (const line of page.lines) {
    const groups = toLabelGroups(line);
    if (groups.length < 3) continue;

    // First match wins per role, so a repeated word later on the line can't
    // move a column that was already identified.
    const roles = new Map<ColumnRole, number>();
    for (const group of groups) {
      const role = roleFor(group.text);
      if (role && !roles.has(role)) roles.set(role, group.start);
    }

    const score = roles.size;
    if (!best || score > best.score) best = { line, groups, roles, score };
  }

  if (!best) return null;

  // A real header names a date column and at least one money column. Without
  // both, this is some other line that happened to contain a matching word.
  const hasDate = best.roles.has("date");
  const hasMoney = ["debit", "credit", "amount", "balance"].some((r) => best!.roles.has(r as ColumnRole));
  if (!hasDate || !hasMoney || best.score < 3) return null;

  const sorted = [...best.roles.entries()].map(([role, start]) => ({ role, start })).sort((a, b) => a.start - b.start);

  const columns: DetectedColumn[] = sorted.map((col, i) => ({
    role: col.role,
    range: [
      // The leftmost column extends to -Infinity so a cell drifting slightly
      // left of its own header still lands in it.
      i === 0 ? Number.NEGATIVE_INFINITY : col.start,
      i === sorted.length - 1 ? Number.POSITIVE_INFINITY : sorted[i + 1].start,
    ] as [number, number],
  }));

  return { headerY: best.line.y, columns };
}

function rangeOf(layout: TableLayout, role: ColumnRole): [number, number] | null {
  return layout.columns.find((c) => c.role === role)?.range ?? null;
}

function cellText(line: PageLine, layout: TableLayout, role: ColumnRole): string {
  const range = rangeOf(layout, role);
  if (!range) return "";
  return textInRange(line, range);
}

/** Normalised form used to spot page furniture that repeats across pages. */
function boilerplateKey(line: PageLine): string {
  // Digits collapse to "#" so "Page 1 of 10" and "Page 2 of 10" -- the same
  // furniture with a different number -- compare equal.
  const text = lineToText(line).toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
  return `${Math.round(line.y / 2) * 2}|${text}`;
}

/**
 * Identifies repeating page furniture (footers, running headers) by position
 * and normalised text.
 *
 * This matters more than it looks: block assembly sweeps every non-anchor line
 * into the nearest transaction's description, so an unstripped footer becomes
 * part of a real transaction's description -- and descriptions feed the dedup
 * fingerprint. The same transaction sitting mid-page in one statement and
 * beside a footer in an overlapping one would then produce two different
 * fingerprints and import twice.
 */
function findBoilerplateKeys(pages: StatementPage[]): Set<string> {
  if (pages.length < 2) return new Set();

  const counts = new Map<string, number>();
  for (const page of pages) {
    // Count each key once per page, so a line repeated within one page doesn't
    // reach the threshold on its own.
    for (const key of new Set(page.lines.map(boilerplateKey))) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const threshold = Math.max(2, Math.ceil(pages.length / 2));
  return new Set([...counts.entries()].filter(([, n]) => n >= threshold).map(([key]) => key));
}

/** A transaction's anchor line plus the wrapped description lines belonging to it. */
type Block = { anchor: PageLine; lines: PageLine[] };

/**
 * Groups a page's content lines into per-transaction blocks.
 *
 * Splitting on vertical gaps -- the obvious approach -- does not work. On the
 * Mashreq statement the gap *between* transactions is ~15pt while gaps within
 * one transaction's wrapped description run 11.6-14.6pt, so no threshold
 * separates them. What does hold is that every transaction has exactly one
 * dated line: so anchors define the blocks, and the lines between two anchors
 * are split at their single largest gap. That handles UBL (description wraps
 * only below its data line) and Mashreq (wraps above *and* below) with one
 * rule, because the largest gap between two anchors is always the seam between
 * one transaction's trailing lines and the next's leading lines.
 */
function groupIntoBlocks(lines: PageLine[], isAnchor: (line: PageLine) => boolean): Block[] {
  const anchorIndexes = lines.map((line, i) => (isAnchor(line) ? i : -1)).filter((i) => i >= 0);
  if (anchorIndexes.length === 0) return [];

  const blocks: Block[] = anchorIndexes.map((i) => ({ anchor: lines[i], lines: [] }));

  // Everything before the first anchor is that transaction's leading text, and
  // everything after the last is the final transaction's trailing text.
  for (let i = 0; i < anchorIndexes[0]; i++) blocks[0].lines.push(lines[i]);
  for (let i = anchorIndexes[anchorIndexes.length - 1] + 1; i < lines.length; i++) {
    blocks[blocks.length - 1].lines.push(lines[i]);
  }
  for (const i of anchorIndexes) {
    const block = blocks[anchorIndexes.indexOf(i)];
    block.lines.push(lines[i]);
  }

  for (let a = 0; a < anchorIndexes.length - 1; a++) {
    const from = anchorIndexes[a];
    const to = anchorIndexes[a + 1];
    if (to - from <= 1) continue;

    // Find the widest vertical gap among the lines separating the two anchors,
    // including the gaps to the anchors themselves.
    let splitAfter = from;
    let widest = -Infinity;
    for (let i = from; i < to; i++) {
      const gap = lines[i].y - lines[i + 1].y;
      if (gap > widest) {
        widest = gap;
        splitAfter = i;
      }
    }

    for (let i = from + 1; i <= splitAfter; i++) blocks[a].lines.push(lines[i]);
    for (let i = splitAfter + 1; i < to; i++) blocks[a + 1].lines.push(lines[i]);
  }

  // Restore document order within each block; the anchor was appended out of
  // sequence above.
  for (const block of blocks) block.lines.sort((x, y) => y.y - x.y);
  return blocks;
}

type Amounts = { debit: number | null; credit: number | null; isOpeningMarker: boolean };

/**
 * Resolves a block's debit/credit from whichever amount columns the statement
 * actually uses.
 *
 * Three conventions are handled: separate debit and credit columns with the
 * unused one left blank (Mashreq), separate columns with the unused one
 * printed as a literal "0" (UBL), and a single signed amount column.
 */
function resolveAmounts(anchor: PageLine, layout: TableLayout): Amounts {
  const single = rangeOf(layout, "amount");
  if (single) {
    const parsed = parseAmount(textInRange(anchor, single));
    if (!parsed) return { debit: null, credit: null, isOpeningMarker: false };
    // A lone amount column has to carry its own sign; unsigned means we can't
    // tell direction, so leave both null and let validation flag the row.
    if (parsed.isCredit === null) return { debit: null, credit: null, isOpeningMarker: parsed.value === 0 };
    return parsed.isCredit
      ? { debit: null, credit: parsed.value, isOpeningMarker: false }
      : { debit: parsed.value, credit: null, isOpeningMarker: false };
  }

  const debitParsed = parseAmount(cellText(anchor, layout, "debit"));
  const creditParsed = parseAmount(cellText(anchor, layout, "credit"));

  // Both columns present and both zero: this is an opening/closing balance
  // marker row, not a transaction.
  if (debitParsed?.value === 0 && creditParsed?.value === 0) {
    return { debit: null, credit: null, isOpeningMarker: true };
  }

  // A literal zero opposite a real amount means "unused", not a zero-value
  // transaction -- so drop it rather than reporting a row with both sides set.
  const debitValue = debitParsed && !(debitParsed.value === 0 && creditParsed && creditParsed.value !== 0) ? debitParsed : null;
  const creditValue = creditParsed && !(creditParsed.value === 0 && debitParsed && debitParsed.value !== 0) ? creditParsed : null;

  // An explicit sign in the cell overrides which column it sat in. On the
  // statements seen these agree (Mashreq prints "+" in Credit and "-" in
  // Debit); where they disagree the sign is the more deliberate signal, and
  // the running-balance check will catch it either way.
  if (debitValue?.isCredit === true) return { debit: null, credit: debitValue.value, isOpeningMarker: false };
  if (creditValue?.isCredit === false) return { debit: creditValue.value, credit: null, isOpeningMarker: false };

  return { debit: debitValue?.value ?? null, credit: creditValue?.value ?? null, isOpeningMarker: false };
}

function blockDescription(block: Block, layout: TableLayout): string {
  const parts = block.lines.map((line) =>
    // On the anchor line only the description cell is wanted -- the rest is
    // date, amounts and balance. Wrapped lines contribute their whole text.
    line === block.anchor ? cellText(line, layout, "description") : lineToText(line)
  );
  return normalizeDescription(parts);
}

/**
 * Parses every page's table into transaction rows.
 *
 * Pages are parsed independently (statements repeat their header on each
 * page), but a page whose header can't be found reuses the previous page's
 * layout rather than being dropped.
 */
export function parseStatementTable(pages: StatementPage[]): TableParseResult {
  const boilerplate = findBoilerplateKeys(pages);
  const rows: ParsedTransactionRow[] = [];
  const pagesWithoutLayout: number[] = [];
  let openingBalance: number | null = null;
  let carriedLayout: TableLayout | null = null;

  for (const page of pages) {
    // Annotated rather than inferred: `carriedLayout` is assigned from this
    // below, so inference would be circular.
    const layout: TableLayout | null = detectLayout(page) ?? carriedLayout;
    if (!layout) {
      pagesWithoutLayout.push(page.pageIndex);
      continue;
    }
    carriedLayout = layout;

    const dateRange = rangeOf(layout, "date");
    if (!dateRange) {
      pagesWithoutLayout.push(page.pageIndex);
      continue;
    }
    const isAnchor = (line: PageLine) => parseStatementDate(textInRange(line, dateRange)) !== null;

    const content = page.lines.filter(
      // Below the header only -- that alone removes the account-details block
      // and running page headers. Repeating footers still need stripping, and
      // an anchor is never treated as furniture no matter how it scores.
      (line) => line.y < layout.headerY && (!boilerplate.has(boilerplateKey(line)) || isAnchor(line))
    );

    for (const block of groupIntoBlocks(content, isAnchor)) {
      const transactionDate = parseStatementDate(textInRange(block.anchor, dateRange));
      if (!transactionDate) continue;

      const balanceRaw = cellText(block.anchor, layout, "balance");
      const balanceAfter = parseAmount(balanceRaw)?.value ?? null;
      const { debit, credit, isOpeningMarker } = resolveAmounts(block.anchor, layout);

      if (isOpeningMarker) {
        // First marker wins: it's the statement's opening figure, and a later
        // one would be a carried-forward subtotal.
        if (openingBalance === null && balanceAfter !== null) openingBalance = balanceAfter;
        continue;
      }

      const reference = cellText(block.anchor, layout, "reference").trim();

      rows.push({
        transactionDate,
        description: blockDescription(block, layout),
        instrumentNumber: reference.length > 0 ? reference : null,
        debit,
        credit,
        balanceAfter,
        pageIndex: page.pageIndex,
      });
    }
  }

  return { rows, openingBalance, pagesWithoutLayout };
}
