import type { PageLine, PositionedItem } from "@/lib/bank/parseTypes";

// Pure geometry helpers, deliberately free of any PDF-library or server-only
// import so they can be unit-tested directly. pdfGeometry.ts wires these to
// pdf-parse.

// A visual row's items can sit a fraction of a point apart (superscripts,
// mixed font sizes, kerning). Exact float equality on the baseline -- what
// the previous implementation used -- split those into separate lines, which
// is one of the ways transaction rows were getting mangled.
export const Y_TOLERANCE = 2.0;

// Gap between the end of one run and the start of the next, in points, that
// we treat as a column boundary rather than a word break.
const COLUMN_GAP = 8;

/**
 * Groups a page's text runs into baseline-ordered lines. PDF user space puts
 * the origin at the bottom-left, so reading order is descending y; within a
 * line it's ascending x.
 */
export function groupItemsIntoLines(items: PositionedItem[]): PageLine[] {
  const usable = items.filter((i) => i.str.trim().length > 0);
  if (usable.length === 0) return [];

  const byDescendingY = [...usable].sort((a, b) => b.y - a.y);
  const lines: PageLine[] = [];

  for (const item of byDescendingY) {
    const current = lines[lines.length - 1];
    if (current && Math.abs(current.y - item.y) <= Y_TOLERANCE) {
      current.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
  }
  return lines;
}

/**
 * Flattens a line back to plain text, preserving column gaps as runs of
 * whitespace. Used for the LLM repair path and for debug dumps -- unlike the
 * old extractor, columns stay visually separated instead of being glued into
 * "12-04-2025ATM WITHDRAWAL5,000.0043,210.00".
 */
export function lineToText(line: PageLine): string {
  let out = "";
  let prevEnd: number | null = null;
  for (const item of line.items) {
    if (prevEnd != null) {
      const gap = item.x - prevEnd;
      out += gap > COLUMN_GAP ? "   " : gap > 0.5 ? " " : "";
    }
    out += item.str;
    prevEnd = item.x + item.width;
  }
  return out.trim();
}

/** Text of the items whose horizontal span overlaps [start, end). */
export function textInRange(line: PageLine, range: [number, number]): string {
  const [start, end] = range;
  const parts = line.items.filter((item) => {
    const mid = item.x + item.width / 2;
    return mid >= start && mid < end;
  });
  if (parts.length === 0) return "";
  return lineToText({ y: line.y, items: parts });
}
