// pdf-parse@1.x ships no bundled types and no @types package is used here
// (deliberately, to avoid a duplicate/mismatched declaration) -- this is a
// minimal ambient declaration covering only what src/lib/bank/pdfGeometry.ts
// actually uses.
declare module "pdf-parse" {
  type PdfParseOptions = {
    // pdf-parse hands this callback a pdfjs page proxy; callers narrow it
    // to what they need (see pdfGeometry.ts's PdfPageProxy).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagerender?: (pageData: any) => Promise<string> | string;
    max?: number;
    version?: string;
  };

  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  };

  function pdfParse(dataBuffer: Buffer, options?: PdfParseOptions): Promise<PdfParseResult>;
  export = pdfParse;
}
