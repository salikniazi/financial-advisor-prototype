import "server-only";
import { extractWithForcedTool, REASONING_MODEL, ToolDef } from "@/lib/ai/openrouter";
import { pdfPageToDataUri } from "@/lib/bank/splitPdfPages";

// Per-page vision extraction. Sends one page's PDF bytes to the reasoning
// model and asks it to transcribe every transaction row on that page. This
// is the step that replaced whole-document text transcription -- the
// previous implementation asked one call to retype ~30,000 tokens' worth of
// transactions and both corrupted data and blew the 60s function budget
// doing it. Fanning out per page keeps each call's output small (a handful
// of rows) and lets pages run in parallel.
//
// Output here is untrusted until verifyExtraction.ts cross-checks it against
// the PDF's own text layer -- that's what makes trusting a vision model here
// reasonable at all.

export type VisionTransaction = {
  date: string;
  description: string;
  instrument_number?: string;
  debit?: number;
  credit?: number;
  balance_after?: number;
};

export type PageExtractionResult =
  | { ok: true; pageIndex: number; transactions: VisionTransaction[] }
  | { ok: false; pageIndex: number; error: string };

const EXTRACTION_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "record_page_transactions",
    description: "Records every transaction row visible on this single statement page, in the order they appear top to bottom.",
    parameters: {
      type: "object",
      properties: {
        transactions: {
          type: "array",
          description: "One entry per transaction row on this page. Empty array if this page has no transaction table.",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Transaction date, YYYY-MM-DD." },
              description: {
                type: "string",
                description: "The full particulars/narration text exactly as printed -- do not paraphrase, summarize, or omit reference numbers.",
              },
              instrument_number: { type: "string", description: "Cheque/instrument number if shown on this row. Omit if not present." },
              debit: { type: "number", description: "Debit amount as a plain positive number. Omit entirely if this row is not a debit." },
              credit: { type: "number", description: "Credit amount as a plain positive number. Omit entirely if this row is not a credit." },
              balance_after: { type: "number", description: "Balance shown after this specific row, only if this row prints one." },
            },
            required: ["date", "description"],
            additionalProperties: false,
          },
        },
      },
      required: ["transactions"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `You read a single page of a bank account statement and extract every distinct transaction row visible on it, in the order they appear.

This is a financial document: transcribe every date and amount exactly as printed, character for character. Do not round, approximate, or "clean up" a number. Do not paraphrase or summarize a description -- copy the printed text.

Some pages are not transaction tables at all (a cover page, an account summary, terms and conditions). Call record_page_transactions with an empty array for those rather than inventing rows.

Do not skip a row because it looks unusual (an opening balance line, a fee, a reversal) -- extract it as printed and let downstream logic decide what it means. Always call record_page_transactions exactly once.`;

/** Extracts one page's transactions. `pageIndex` is 0-based, used only for labelling and the result. */
export async function extractPageTransactions(pageBuffer: Buffer, pageIndex: number): Promise<PageExtractionResult> {
  const result = await extractWithForcedTool<{ transactions: VisionTransaction[] }>({
    model: REASONING_MODEL,
    systemPrompt: SYSTEM_PROMPT,
    userContent: [
      { type: "text", text: `This is page ${pageIndex + 1} of a bank statement. Extract every transaction on it.` },
      { type: "file", file: { filename: `statement-page-${pageIndex + 1}.pdf`, file_data: pdfPageToDataUri(pageBuffer) } },
    ],
    tool: EXTRACTION_TOOL,
    // Engine name unverified against OpenRouter's current docs -- see the
    // plan's Phase 0 note. Adjust here if the model receives no document.
    plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
    maxTokens: 4096,
  });

  if (!result.ok) return { ok: false, pageIndex, error: result.error };
  return { ok: true, pageIndex, transactions: Array.isArray(result.value.transactions) ? result.value.transactions : [] };
}

/** Fans out extraction across every page's split PDF bytes, in parallel. */
export async function extractAllPages(pageBuffers: Buffer[]): Promise<PageExtractionResult[]> {
  return Promise.all(pageBuffers.map((buf, i) => extractPageTransactions(buf, i)));
}
