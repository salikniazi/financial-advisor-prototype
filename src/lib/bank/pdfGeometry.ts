import "server-only";
import pdfParse from "pdf-parse";
import type { PositionedItem, StatementPage } from "@/lib/bank/parseTypes";
import { groupItemsIntoLines } from "@/lib/bank/geometryUtils";

// Positioned text extraction. The previous implementation read only
// item.transform[5] (the y-coordinate) and concatenated same-baseline runs
// with no separator at all, so a table row arrived as
// "12-04-2025ATM WITHDRAWAL5,000.0043,210.00" -- the column geometry was
// available from pdfjs and thrown away, then an LLM was asked to guess it
// back. Keeping x is what makes real column detection (statementTable.ts)
// possible.
//
// Still pinned to pdf-parse@1.x: its vendored pdfjs needs no worker script
// and no canvas binary, both of which failed under Next's serverless
// bundling. We only use its `pagerender` hook to reach the page proxy.

// Below this many characters on a page, treat the page as having no usable
// text layer. Applied per page rather than to the document average, so a
// statement with some scanned pages is caught instead of averaged out --
// see the two checks below: one for "no page has text" (a fully scanned
// PDF), one for "some page that should have text doesn't" (a partially
// scanned PDF, which is the more dangerous case since it fails silently
// rather than obviously).
const MIN_CHARS_PER_PAGE = 40;

type RawTextItem = { str: string; transform: number[]; width?: number };
type PdfPageProxy = {
  getTextContent: (opts?: Record<string, unknown>) => Promise<{ items: RawTextItem[] }>;
};

export type GeometryResult = { ok: true; pages: StatementPage[] } | { ok: false; error: string };

function pageCharCount(page: StatementPage): number {
  return page.lines.reduce((sum, line) => sum + line.items.reduce((s, i) => s + i.str.trim().length, 0), 0);
}

export async function extractPageGeometry(buffer: Buffer): Promise<GeometryResult> {
  const pages: StatementPage[] = [];

  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: PdfPageProxy) => {
        // disableCombineTextItems keeps runs separate so their individual x
        // positions survive; combined items lose the internal boundaries
        // needed to tell a description from an amount.
        const { items } = await pageData.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: true,
        });

        const positioned: PositionedItem[] = items.map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: typeof item.width === "number" ? item.width : 0,
        }));

        pages.push({ pageIndex: pages.length, lines: groupItemsIntoLines(positioned) });
        // pdf-parse concatenates whatever we return; we keep our own
        // structured copy above and don't use its flattened string.
        return "";
      },
    });
  } catch (err) {
    return { ok: false, error: `Couldn't read this PDF: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (pages.length === 0) {
    return { ok: false, error: "This PDF has no pages Lime could read." };
  }

  if (pages.every((p) => pageCharCount(p) < MIN_CHARS_PER_PAGE)) {
    return {
      ok: false,
      error: "This PDF doesn't appear to have readable text — scanned/image-only statements aren't supported yet.",
    };
  }

  // A statement where *some* pages have no text layer is worse than one where
  // none do: `every()` above lets it through, and every downstream stage
  // would then silently parse a partial statement -- some pages' rows just
  // never existed as far as the parser is concerned, with nothing telling
  // the user that happened. Catch that here rather than importing a
  // fraction of the transactions with no indication of the gap.
  //
  // A genuinely sparse but real (non-scanned) page -- a short cover sheet or
  // a "this page intentionally left blank" separator -- would also fail this
  // check. That's deliberately not special-cased: distinguishing "no text
  // because scanned" from "little text because genuinely sparse" from line
  // structure alone is unreliable (a scanned page has zero items either
  // way, so a laxer check meant to exempt one ends up exempting both,
  // silently defeating this fix for the case it exists to catch). If a real
  // fixture turns out to have such a page, revisit with a positional
  // signal (e.g. only the first/last page) rather than a structural one.
  const unreadablePages = pages.filter((p) => pageCharCount(p) < MIN_CHARS_PER_PAGE);
  if (unreadablePages.length > 0) {
    const pageList = unreadablePages.map((p) => p.pageIndex + 1).join(", ");
    return {
      ok: false,
      error: `Page${unreadablePages.length === 1 ? "" : "s"} ${pageList} of this PDF don't appear to have readable text (scanned/image-only), so Lime can't parse this statement without missing transactions.`,
    };
  }

  return { ok: true, pages };
}
