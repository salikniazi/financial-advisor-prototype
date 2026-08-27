import "server-only";
import type { PDFParse as PDFParseClass } from "pdf-parse";

export type PdfExtractionResult = { ok: true; pages: string[] } | { ok: false; error: string };

// Below this average extracted characters per page, treat the PDF as having
// no meaningful text layer (e.g. a scanned/image-only statement) rather than
// sending near-empty content to the model — the primary defense against
// silently mishandling a statement we can't actually read.
const MIN_CHARS_PER_PAGE = 40;

// pdfjs-dist's legacy Node build (used internally by pdf-parse) tries to
// polyfill DOMMatrix/ImageData/Path2D via the optional `@napi-rs/canvas`
// package at module-LOAD time, and crashes the entire module outright if
// that polyfill attempt fails -- which it reliably does in a Vercel
// serverless bundle, since canvas's native binary isn't picked up by
// Next's dependency tracing. We only ever call getText() here -- text
// extraction never touches canvas/rendering -- so a bare stand-in is
// enough to satisfy pdfjs's load-time check and skip that broken fallback
// path entirely. This must run BEFORE pdf-parse's module graph loads,
// which is why the import below is dynamic rather than static: a static
// `import` at the top of this file would already have crashed by the
// time this function body runs.
function installPdfjsCanvasPolyfills() {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = class DOMMatrix {};
  if (typeof g.ImageData === "undefined") g.ImageData = class ImageData {};
  if (typeof g.Path2D === "undefined") g.Path2D = class Path2D {};
}

/**
 * Extracts per-page text from a PDF buffer. Returns page texts in document
 * order (not one flattened string) so callers can chunk page-aware.
 */
export async function extractPdfPageTexts(buffer: Buffer): Promise<PdfExtractionResult> {
  installPdfjsCanvasPolyfills();
  const { PDFParse } = await import("pdf-parse");

  let parser: PDFParseClass | null = null;
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
