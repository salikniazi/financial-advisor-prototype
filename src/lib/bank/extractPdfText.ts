import "server-only";
import pdfParse from "pdf-parse";

export type PdfExtractionResult = { ok: true; pages: string[] } | { ok: false; error: string };

// Below this average extracted characters per page, treat the PDF as having
// no meaningful text layer (e.g. a scanned/image-only statement) rather than
// sending near-empty content to the model — the primary defense against
// silently mishandling a statement we can't actually read.
const MIN_CHARS_PER_PAGE = 40;

// pdf-parse@1.x is used deliberately over the newer 2.x class-based API: 2.x
// wraps pdfjs-dist's browser-oriented worker/canvas architecture, and both
// its optional canvas polyfill (@napi-rs/canvas) and its worker script load
// path failed to survive Next's serverless bundling on Vercel in practice
// (missing-module errors for both, in two separate deploys). 1.x vendors an
// old pdfjs-dist build directly and sets `PDFJS.disableWorker = true`
// itself -- no worker, no canvas, nothing for a bundler to lose track of.
type PageTextItem = { str: string; transform: number[] };
type PdfPageProxy = { getTextContent: (opts?: Record<string, unknown>) => Promise<{ items: PageTextItem[] }> };

async function renderPageText(pageData: PdfPageProxy): Promise<string> {
  const { items } = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
  let lastY: number | undefined;
  let text = "";
  for (const item of items) {
    if (lastY === item.transform[5] || lastY === undefined) {
      text += item.str;
    } else {
      text += `\n${item.str}`;
    }
    lastY = item.transform[5];
  }
  return text;
}

/**
 * Extracts per-page text from a PDF buffer. Returns page texts in document
 * order (not one flattened string) so callers can chunk page-aware.
 */
export async function extractPdfPageTexts(buffer: Buffer): Promise<PdfExtractionResult> {
  const pages: string[] = [];
  try {
    await pdfParse(buffer, {
      pagerender: async (pageData: PdfPageProxy) => {
        const text = await renderPageText(pageData);
        pages.push(text);
        return text;
      },
    });

    if (pages.length === 0) {
      return { ok: false, error: "This PDF has no pages Lime could read." };
    }

    const totalChars = pages.reduce((sum, p) => sum + p.trim().length, 0);
    const avgCharsPerPage = totalChars / pages.length;
    if (avgCharsPerPage < MIN_CHARS_PER_PAGE) {
      return {
        ok: false,
        error: "This PDF doesn't appear to have readable text — scanned/image-only statements aren't supported yet.",
      };
    }

    return { ok: true, pages };
  } catch (err) {
    return { ok: false, error: `Couldn't read this PDF: ${err instanceof Error ? err.message : String(err)}` };
  }
}
