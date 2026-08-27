import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfPageTexts } from "@/lib/bank/extractPdfText";
import { chunkPages, extractStatementMetadata, extractTransactionsChunk, ExtractedTransaction } from "@/lib/bank/statementExtraction";
import { computeTransactionFingerprint } from "@/lib/bank/fingerprint";

export type ProcessStatementResult =
  | { ok: true; insertedCount: number; duplicateCount: number; totalExtracted: number }
  | { ok: false; error: string };

type ImportRow = {
  id: string;
  user_id: string;
  account_id: string;
  file_path: string;
  status: string;
};

/**
 * Runs the full Stage B pipeline for one already-uploaded statement: download
 * the PDF, extract text, run the metadata + chunked transaction LLM passes,
 * dedupe + insert, and update the import row's status. Synchronous within one
 * request -- no background job queue at this stage (see Stage B prompt).
 *
 * Every DB/storage operation uses the caller's own session-bound Supabase
 * client, so RLS enforces ownership throughout -- never a service-role
 * bypass, and never a client-supplied user id.
 */
export async function processStatementImport(supabase: SupabaseClient, importId: string): Promise<ProcessStatementResult> {
  const { data: importRow, error: fetchError } = await supabase
    .from("bank_statement_imports")
    .select("id, user_id, account_id, file_path, status")
    .eq("id", importId)
    .single();

  if (fetchError || !importRow) {
    return { ok: false, error: "Statement not found." };
  }
  const row = importRow as ImportRow;

  // "processing" and "failed" are allowed as retry targets too, not just
  // "uploaded": processing runs synchronously within one request, and a
  // platform-level timeout kills that request outright (no JS exception
  // this code can catch to mark it "failed" itself) -- so a statement that
  // times out or hits a transient extraction error needs a way back in,
  // not a permanent dead end that only a fresh re-upload can escape.
  if (row.status === "needs_review" || row.status === "completed") {
    return { ok: false, error: `This statement is already ${row.status} -- it can't be processed again.` };
  }

  await supabase.from("bank_statement_imports").update({ status: "processing" }).eq("id", importId);

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage.from("bank-statements").download(row.file_path);
    if (downloadError || !fileBlob) {
      return await fail(supabase, importId, `Couldn't download the uploaded file: ${downloadError?.message ?? "unknown error"}`);
    }
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    const extraction = await extractPdfPageTexts(buffer);
    if (!extraction.ok) {
      return await fail(supabase, importId, extraction.error);
    }
    const { pages } = extraction;

    const metadataResult = await extractStatementMetadata({
      firstPageText: pages[0],
      lastPageText: pages[pages.length - 1],
    });
    if (!metadataResult.ok) {
      return await fail(supabase, importId, `Couldn't read the statement's metadata: ${metadataResult.error}`);
    }
    const metadata = metadataResult.value;

    // Run chunk extraction calls concurrently, not sequentially -- these are
    // network-bound LLM calls, so wall-clock time is roughly the slowest
    // single chunk rather than their sum. That matters a lot here: the whole
    // request runs synchronously within one Vercel function call (no job
    // queue at this stage) capped at 60s, and a multi-chunk statement
    // processed sequentially can blow through that on its own. Promise.all
    // preserves input order in its results regardless of completion timing,
    // so page order is unaffected.
    const chunks = chunkPages(pages);
    const chunkResults = await Promise.all(
      chunks.map((chunk) => extractTransactionsChunk({ chunkText: chunk.join("\n\n"), hasRunningBalance: metadata.has_running_balance }))
    );
    const failedChunk = chunkResults.find((r) => !r.ok);
    if (failedChunk && !failedChunk.ok) {
      return await fail(supabase, importId, `Couldn't read the statement's transactions: ${failedChunk.error}`);
    }
    const allTransactions: ExtractedTransaction[] = chunkResults.flatMap((r) => (r.ok ? r.value : []));

    if (allTransactions.length === 0) {
      return await fail(supabase, importId, "Lime couldn't find any transactions in this statement.");
    }

    const rows = allTransactions.map((t) => {
      const debit = typeof t.debit === "number" ? t.debit : null;
      const credit = typeof t.credit === "number" ? t.credit : null;
      const balanceAfter = metadata.has_running_balance && typeof t.balance_after === "number" ? t.balance_after : null;
      return {
        user_id: row.user_id,
        account_id: row.account_id,
        statement_import_id: importId,
        transaction_date: t.date,
        description: t.description,
        instrument_number: t.instrument_number || null,
        debit,
        credit,
        balance_after: balanceAfter,
        balance_source: balanceAfter != null ? ("stated" as const) : null,
        category: t.category,
        fingerprint: computeTransactionFingerprint({
          accountId: row.account_id,
          transactionDate: t.date,
          debit,
          credit,
          description: t.description,
        }),
      };
    });

    // Rely on the unique (account_id, fingerprint) constraint from Stage A:
    // ON CONFLICT DO NOTHING via upsert+ignoreDuplicates skips anything
    // already imported in one round trip. RETURNING only includes rows that
    // were actually inserted, so the count difference tells us how many were
    // duplicates.
    const { data: insertedRows, error: insertError } = await supabase
      .from("bank_transactions")
      .upsert(rows, { onConflict: "account_id,fingerprint", ignoreDuplicates: true })
      .select("id");

    if (insertError) {
      return await fail(supabase, importId, `Couldn't save the extracted transactions: ${insertError.message}`);
    }

    const insertedCount = insertedRows?.length ?? 0;
    const duplicateCount = rows.length - insertedCount;

    // Prefer the statement's explicitly stated period; fall back to the
    // extracted transactions' own date range (covers both "no explicit
    // period printed" and, since this uses the full extracted set rather
    // than only newly-inserted rows, "every transaction was a duplicate").
    const dates = allTransactions.map((t) => t.date).sort();
    const periodStart = metadata.period_start ?? dates[0];
    const periodEnd = metadata.period_end ?? dates[dates.length - 1];

    await supabase
      .from("bank_statement_imports")
      .update({
        status: "needs_review",
        period_start: periodStart,
        period_end: periodEnd,
        has_running_balance: metadata.has_running_balance,
        opening_balance: metadata.opening_balance ?? null,
        closing_balance: metadata.closing_balance ?? null,
        error_message: null,
      })
      .eq("id", importId);

    return { ok: true, insertedCount, duplicateCount, totalExtracted: rows.length };
  } catch (err) {
    return await fail(supabase, importId, err instanceof Error ? err.message : String(err));
  }
}

async function fail(supabase: SupabaseClient, importId: string, error: string): Promise<{ ok: false; error: string }> {
  await supabase.from("bank_statement_imports").update({ status: "failed", error_message: error }).eq("id", importId);
  return { ok: false, error };
}
