import "server-only";
import { PDFParse } from "pdf-parse";

export type PdfExtractionResult = { ok: true; pages: string[] } | { ok: false; error: string };

// Below this average extracted characters per page, treat the PDF as having
// no meaningful text layer (e.g. a scanned/image-only statement) rather than
// sending near-empty content to the model — the primary defense against
// silently mishandling a statement we can't actually read.
const MIN_CHARS_PER_PAGE = 40;

/**
 * Extracts per-page text from a PDF buffer. Returns page texts in document
 * order (not one flattened string) so callers can chunk page-aware.
 */
export async function extractPdfPageTexts(buffer: Buffer): Promise<PdfExtractionResult> {
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const pages = result.pages.map((p) => p.text ?? "");

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
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // best-effort cleanup; extraction result already captured above
      }
    }
  }
}
