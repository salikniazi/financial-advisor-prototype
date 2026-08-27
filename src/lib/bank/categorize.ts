import "server-only";
import { MODEL, extractWithForcedTool, ToolDef } from "@/lib/ai/openrouter";
import { BANK_CATEGORIES } from "@/lib/bank/categories";

// Categorisation -- the one genuinely subjective step, and the only LLM call
// that runs on every statement rather than once per bank format or only on
// rows that failed validation. Runs on MODEL (Role B): cheap, fast, and a
// wrong category is a one-click fix in the review UI, so there's nothing
// here worth spending Role A's reasoning budget on.
//
// Rows are categorised by merchant, not individually -- statements repeat
// the same merchant many times, so deduping first turns a 100-transaction
// statement into a handful of unique calls instead of 100 near-identical
// ones.

// Above this many unique merchants, categorise only the most frequent ones
// and leave the tail Uncategorized. Keeps this step bounded even on an
// unusually diverse statement, since it's the only step whose cost scales
// with the statement rather than the bank format.
const MAX_UNIQUE_MERCHANTS = 300;

// Batch size per call -- keeps each request's output (~1 category per key)
// well inside a normal response, and keeps a single bad batch from voiding
// the whole statement's categorisation.
const BATCH_SIZE = 100;

const UNCATEGORIZED = "Uncategorized";

/**
 * Derives a stable key for grouping rows by merchant. Strips the
 * transaction-specific noise (reference numbers, RRNs, STANs, IBANs, long
 * digit runs) that would otherwise make every row its own "merchant".
 */
export function merchantKey(description: string): string {
  return description
    .replace(/\b(?:ref|rrn|stan|txnid|msgid)[:\s#-]*[a-z0-9]+/gi, "")
    .replace(/\bPK\d{2}[A-Z]{4}\d{16,}\b/gi, "") // IBAN
    .replace(/\b\d{10,}\b/g, "") // any other long digit run (account numbers, transaction ids)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const CATEGORIZE_TOOL: ToolDef = {
  type: "function",
  function: {
    name: "record_categories",
    description: "Records the best-fitting category for each merchant key.",
    parameters: {
      type: "object",
      properties: {
        categories: {
          type: "object",
          description: "Maps each input index (as a string, e.g. \"0\") to its category.",
          additionalProperties: { type: "string", enum: BANK_CATEGORIES },
        },
      },
      required: ["categories"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `You categorise bank transaction merchant descriptions for a personal finance app in Pakistan. For each numbered merchant description, pick the single best-fitting category from the fixed list the tool schema enforces.

Use "${UNCATEGORIZED}" when genuinely unsure rather than guessing at a specific category. Always call record_categories with an entry for every index given.`;

/**
 * Categorises a batch of already-deduplicated merchant keys. Returns a map
 * from the input index (matching the array position sent) to a category.
 * Any category the model returns that isn't in BANK_CATEGORIES is clamped to
 * Uncategorized here -- enum adherence in the tool schema is an accuracy
 * optimisation, not something to trust blindly, since a stray value would
 * otherwise reach the DB and fail bank_transactions_category_check after
 * the statement's parse has already succeeded.
 */
async function categorizeBatch(keys: string[]): Promise<Map<number, string>> {
  const result = await extractWithForcedTool<{ categories: Record<string, string> }>({
    model: MODEL,
    systemPrompt: SYSTEM_PROMPT,
    userContent: keys.map((k, i) => `${i}: ${k || "(no description)"}`).join("\n"),
    tool: CATEGORIZE_TOOL,
  });

  const out = new Map<number, string>();
  if (!result.ok) return out; // caller treats missing entries as Uncategorized

  const known = new Set(BANK_CATEGORIES);
  for (const [idxStr, category] of Object.entries(result.value.categories ?? {})) {
    const idx = Number(idxStr);
    if (!Number.isInteger(idx) || idx < 0 || idx >= keys.length) continue;
    out.set(idx, known.has(category) ? category : UNCATEGORIZED);
  }
  return out;
}

/**
 * Categorises a list of transaction descriptions, returning one category per
 * input in the same order. Descriptions sharing a merchant key get the same
 * category from a single call. Any failure (a batch call error, a merchant
 * beyond the cap) degrades to Uncategorized rather than failing the whole
 * statement -- this runs after rows are already durably inserted, so the
 * worst case here is a category the user fixes by hand, not a lost import.
 */
export async function categorizeDescriptions(descriptions: string[]): Promise<string[]> {
  const keyOf = descriptions.map(merchantKey);

  // Order unique keys by frequency so, if the cap is hit, the merchants that
  // actually cover the most rows are the ones that get categorised.
  const countByKey = new Map<string, number>();
  for (const k of keyOf) countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
  const uniqueKeys = [...countByKey.keys()].sort((a, b) => (countByKey.get(b) ?? 0) - (countByKey.get(a) ?? 0));
  const keysToCategorize = uniqueKeys.slice(0, MAX_UNIQUE_MERCHANTS);

  const categoryByKey = new Map<string, string>();
  const batches: string[][] = [];
  for (let i = 0; i < keysToCategorize.length; i += BATCH_SIZE) batches.push(keysToCategorize.slice(i, i + BATCH_SIZE));

  const batchResults = await Promise.all(batches.map(categorizeBatch));
  batches.forEach((batch, batchIdx) => {
    const result = batchResults[batchIdx];
    batch.forEach((key, i) => {
      categoryByKey.set(key, result.get(i) ?? UNCATEGORIZED);
    });
  });

  return keyOf.map((key) => categoryByKey.get(key) ?? UNCATEGORIZED);
}
