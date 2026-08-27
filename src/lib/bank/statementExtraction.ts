import "server-only";
import { extractWithForcedTool, ToolDef } from "@/lib/ai/openrouter";
import { BANK_CATEGORIES } from "@/lib/bank/categories";

// Pages per chunk for the transaction-extraction pass. Chunking here isn't
// about the model's context window (a whole statement fits easily) -- it's
// about output reliability: a single call asked to emit a very large
// structured array has more surface area for truncation/malformed output
// than several smaller batches assembled afterward.
export const PAGES_PER_CHUNK = 8;

export function chunkPages(pages: string[], size = PAGES_PER_CHUNK): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < pages.length; i += size) {
    chunks.push(pages.slice(i, i + size));
  }
  return chunks;
}

// --- Metadata pass -----------------------------------------------------

export type StatementMetadata = {
  period_start?: string;
  period_end?: string;
  has_running_balance: boolean;
  opening_balance?: number;
  closing_balance?: number;
};

const METADATA_SYSTEM_PROMPT = `You analyze the first and last pages of a Pakistani bank account statement (plain text, extracted from a PDF -- column alignment may be imperfect) and extract statement-level metadata only, never individual transactions.

Determine:
- period_start / period_end: the statement's stated period, ONLY if the text explicitly prints one (e.g. "Statement Period: 12 Apr 2025 to 12 Apr 2026", "For the period ..."). Do not infer this from transaction dates -- omit both fields entirely if no explicit period is printed.
- has_running_balance: true if the statement shows a running balance value after each individual transaction row; false if it only shows period totals or a summary balance.
- opening_balance / closing_balance: ONLY if the statement explicitly prints these figures (e.g. "Opening Balance", "Balance Brought Forward", "Closing Balance", "Balance Carried Forward"). Never calculate or estimate them -- omit whichever one isn't explicitly stated.

Always call record_statement_metadata with your result.`;

const recordStatementMetadataTool: ToolDef = {
  type: "function",
  function: {
    name: "record_statement_metadata",
    description: "Records statement-level metadata read from the first and last pages of a bank statement.",
    parameters: {
      type: "object",
      properties: {
        period_start: { type: "string", description: "Statement period start, YYYY-MM-DD. Omit if not explicitly printed." },
        period_end: { type: "string", description: "Statement period end, YYYY-MM-DD. Omit if not explicitly printed." },
        has_running_balance: {
          type: "boolean",
          description: "True if a balance is shown after each individual transaction row; false if only period totals are shown.",
        },
        opening_balance: { type: "number", description: "Opening balance for the period, only if explicitly printed. Omit otherwise." },
        closing_balance: { type: "number", description: "Closing balance for the period, only if explicitly printed. Omit otherwise." },
      },
      required: ["has_running_balance"],
      additionalProperties: false,
    },
  },
};

export async function extractStatementMetadata(opts: {
  firstPageText: string;
  lastPageText: string;
}): Promise<{ ok: true; value: StatementMetadata } | { ok: false; error: string }> {
  const userContent =
    opts.firstPageText === opts.lastPageText
      ? `--- Page 1 (only page) ---\n${opts.firstPageText}`
      : `--- Page 1 ---\n${opts.firstPageText}\n\n--- Last page ---\n${opts.lastPageText}`;

  return extractWithForcedTool<StatementMetadata>({
    systemPrompt: METADATA_SYSTEM_PROMPT,
    userContent,
    tool: recordStatementMetadataTool,
  });
}

// --- Transaction-chunk pass ---------------------------------------------

export type ExtractedTransaction = {
  date: string;
  description: string;
  instrument_number?: string;
  debit?: number;
  credit?: number;
  balance_after?: number;
  category: string;
};

type TransactionsChunkResult = { transactions: ExtractedTransaction[] };

const TRANSACTIONS_SYSTEM_PROMPT = `You extract individual transaction rows from a chunk of a Pakistani bank account statement's text-extracted pages (page order preserved; column alignment is approximate since this is plain text, not a real table -- use judgement to associate each row's date/description/debit/credit/balance correctly).

For every distinct transaction row you can identify in this chunk, call record_transactions_chunk with one entry per transaction, in the order they appear:
- date: YYYY-MM-DD
- description: the raw particulars/narration text exactly as printed -- do not paraphrase or summarize it
- instrument_number: cheque/instrument number if shown on this row, omit otherwise
- debit: a plain positive number, omit entirely if this row is not a debit
- credit: a plain positive number, omit entirely if this row is not a credit
- balance_after: only if this chunk's text actually shows a running balance value for this specific row -- omit otherwise
- category: the single best-fitting category from the fixed list. Use "Uncategorized" if genuinely unsure rather than guessing.

Do not invent transactions that aren't in the text, and do not skip any that are. Always call record_transactions_chunk, even if this chunk has zero transaction rows (pass an empty array) -- some chunks are cover pages, terms and conditions, or blank.`;

function buildTransactionsChunkTool(hasRunningBalance: boolean): ToolDef {
  return {
    type: "function",
    function: {
      name: "record_transactions_chunk",
      description: "Records every transaction row found in this chunk of statement pages, in document order.",
      parameters: {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            description: "One entry per transaction row in this chunk, in the order they appear. Empty array if none.",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "Transaction date, YYYY-MM-DD." },
                description: { type: "string", description: "Raw particulars/narration text exactly as printed -- do not paraphrase." },
                instrument_number: { type: "string", description: "Cheque/instrument number if shown on this row. Omit if not present." },
                debit: { type: "number", description: "Debit amount as a plain positive number. Omit entirely if this row is not a debit." },
                credit: { type: "number", description: "Credit amount as a plain positive number. Omit entirely if this row is not a credit." },
                ...(hasRunningBalance
                  ? {
                      balance_after: {
                        type: "number",
                        description: "Balance shown after this specific transaction. Omit only if this particular row has no balance printed.",
                      },
                    }
                  : {}),
                category: { type: "string", enum: BANK_CATEGORIES, description: "Best-fitting category from the fixed list." },
              },
              required: ["date", "description", "category"],
              additionalProperties: false,
            },
          },
        },
        required: ["transactions"],
        additionalProperties: false,
      },
    },
  };
}

export async function extractTransactionsChunk(opts: {
  chunkText: string;
  hasRunningBalance: boolean;
}): Promise<{ ok: true; value: ExtractedTransaction[] } | { ok: false; error: string }> {
  const result = await extractWithForcedTool<TransactionsChunkResult>({
    systemPrompt: TRANSACTIONS_SYSTEM_PROMPT,
    userContent: opts.chunkText,
    tool: buildTransactionsChunkTool(opts.hasRunningBalance),
  });
  if (!result.ok) return result;
  return { ok: true, value: Array.isArray(result.value.transactions) ? result.value.transactions : [] };
}
