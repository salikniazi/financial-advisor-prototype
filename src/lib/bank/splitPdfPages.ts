import "server-only";
import { PDFDocument } from "pdf-lib";

// Splits a statement PDF into single-page PDFs so vision extraction can be
// fanned out one request per page. Pure JavaScript -- no native binary, no
// worker, no canvas -- which matters specifically because this stack has
// already failed twice trying to bring in something that needed one
// (pdfjs-dist's @napi-rs/canvas polyfill and its worker script both broke
// under Next's serverless bundling; see pdfGeometry.ts's history).
//
// Splitting rather than re-sending the whole document on every request
// matters for cost, not just tidiness: a model that ingests PDFs natively
// rasterises internally and is billed per page, so sending all 17 pages on
// each of 17 calls would be roughly 17x the input spend of sending each page
// once.

/** One page, split out as its own standalone single-page PDF. */
export async function splitPdfIntoPages(buffer: Buffer): Promise<Buffer[]> {
  const source = await PDFDocument.load(buffer);
  const pageCount = source.getPageCount();

  const pages: Buffer[] = [];
  for (let i = 0; i < pageCount; i++) {
    const single = await PDFDocument.create();
    const [copied] = await single.copyPages(source, [i]);
    single.addPage(copied);
    pages.push(Buffer.from(await single.save()));
  }
  return pages;
}

/** A single page's bytes, base64-encoded as the data URI OpenRouter's file content part expects. */
export function pdfPageToDataUri(page: Buffer): string {
  return `data:application/pdf;base64,${page.toString("base64")}`;
}
