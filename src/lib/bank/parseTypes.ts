// Shared shapes for the deterministic statement parser. Kept in their own
// module so the validator and the LLM repair path can both depend on them
// without depending on the parser itself.

/** A single text run from the PDF, with the geometry pdfjs gave us. */
export type PositionedItem = {
  str: string;
  x: number;
  y: number;
  width: number;
};

/** Items sharing a baseline, ordered left to right. */
export type PageLine = {
  y: number;
  items: PositionedItem[];
};

export type StatementPage = {
  pageIndex: number; // 0-based
  lines: PageLine[];
};

/** Which x-range on the page each logical column occupies. */
export type ColumnLayout = {
  date: [number, number];
  description: [number, number];
  debit?: [number, number];
  credit?: [number, number];
  /** Some statements use one signed/marked amount column instead of debit+credit. */
  amount?: [number, number];
  balance?: [number, number];
};

/**
 * One transaction as parsed off the page, before categorisation. `debit` and
 * `credit` stay separate to mirror what the statement actually printed;
 * exactly one should be set.
 */
export type ParsedTransactionRow = {
  transactionDate: string; // ISO YYYY-MM-DD
  description: string;
  instrumentNumber: string | null;
  debit: number | null;
  credit: number | null;
  balanceAfter: number | null;
  /** Where this row came from, so the repair path can target just its page. */
  pageIndex: number;
};

/** Statement-level facts, all derived deterministically -- never from an LLM. */
export type StatementFacts = {
  periodStart: string | null;
  periodEnd: string | null;
  hasRunningBalance: boolean;
  openingBalance: number | null;
  closingBalance: number | null;
};

export type ParseResult = {
  rows: ParsedTransactionRow[];
  facts: StatementFacts;
  /** Pages where a table was found but rows couldn't be assembled cleanly. */
  unparsedPages: number[];
};
