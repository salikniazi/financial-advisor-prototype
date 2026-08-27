import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPageGeometry } from "@/lib/bank/pdfGeometry";
import { splitPdfIntoPages } from "@/lib/bank/splitPdfPages";
import { extractAllPages, VisionTransaction } from "@/lib/bank/visionExtract";
import { verifyPage } from "@/lib/bank/verifyExtraction";
import { deriveStatementFacts } from "@/lib/bank/statementFacts";
import { validateRows, summarizeValidation } from "@/lib/bank/validate";
import { categorizeDescriptions } from "@/lib/bank/categorize";
import { computeTransactionFingerprint, assignOccurrenceIndexes } from "@/lib/bank/fingerprint";
import { parseStatementDate } from "@/lib/bank/normalize";
import type { ParsedTransactionRow, StatementPage } from "@/lib/bank/parseTypes";

export type ProcessStatementResult =
  | { ok: true; insertedCount: number; duplicateCount: number; totalExtracted: number; validationOk: boolean | null }
  | { ok: false; error: string };

type ImportRow = {
  id: string;
  user_id: string;
  account_id: string;
  file_path: string;
  status: string;
};

/**
 * Runs the full statement pipeline for one already-uploaded PDF: download,
 * extract per-page geometry (for verification and deterministic facts),
 * split into single-page PDFs and fan out vision extraction across them,
 * verify every row against the PDF's own text layer, insert as durably as
 * possible, then categorise.
 *
 * The LLM is used for exactly two things: reading a page's transactions
 * (verified against the page's own text afterward, never trusted outright)
 * and categorising merchants (the one genuinely subjective step). Everything
 * else -- column geometry for verification, dates, amounts, the statement's
 * own period/opening/closing balance, deduplication -- is deterministic.
 * That's what fixed the original failure mode: the old metadata pass
 * returned three different opening balances across three runs of the same
 * file, because it asked a model to transcribe a number that regex could
 * read off the page every time, identically.
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

    // Geometry serves two purposes here, neither of which is primary
    // extraction anymore: it's the verification oracle for vision output,
    // and the deterministic source for statement facts (period, opening/
    // closing balance). Its per-page unreadable-text gate also still
    // protects against a partially-scanned PDF importing silently short.
    const geometry = await extractPageGeometry(buffer);
    if (!geometry.ok) {
      return await fail(supabase, importId, geometry.error);
    }
    const { pages } = geometry;

    const pageBuffers = await splitPdfIntoPages(buffer);
    const extractions = await extractAllPages(pageBuffers);

    const failedPages = extractions.filter((e) => !e.ok);
    if (failedPages.length === extractions.length) {
      const firstError = failedPages[0] && !failedPages[0].ok ? failedPages[0].error : "unknown error";
      return await fail(supabase, importId, `Couldn't read any page of this statement: ${firstError}`);
    }

    const visionByPage = new Map<number, VisionTransaction[]>();
    for (const e of extractions) if (e.ok) visionByPage.set(e.pageIndex, e.transactions);

    // Verify every page's vision output against its own text layer. Rows
    // are never silently dropped here for failing a trust check -- a row
    // this code can't verify is still a row a human might be able to,
    // and the whole point of this design is that a missing transaction is
    // worse than an unverified one. Untrusted rows are counted into the
    // validation note instead, so the review UI can flag the statement
    // rather than presenting it as clean.
    const parsedByPage = pages.map((page: StatementPage) => verifyPage(page, visionByPage.get(page.pageIndex) ?? []));

    let untrustedCount = 0;
    let unparseableDateCount = 0;
    const rows: ParsedTransactionRow[] = [];
    for (const page of parsedByPage) {
      for (const { row: r, trusted } of page.rows) {
        if (!trusted) untrustedCount++;
        // A date that never parsed at all can't be stored -- normalize.ts's
        // rule applies here too: reject rather than hand a bad string to a
        // Postgres date cast. This is the one case dropped outright rather
        // than flagged, because there's no valid row to flag.
        if (!parseStatementDate(r.transactionDate)) {
          unparseableDateCount++;
          continue;
        }
        rows.push(r);
      }
    }

    if (rows.length === 0) {
      return await fail(supabase, importId, "Lime couldn't find any transactions in this statement.");
    }

    const facts = deriveStatementFacts(pages, rows);
    const validation = validateRows(rows, facts);

    const occurrenceIndexes = assignOccurrenceIndexes(rows);
    const dbRows = rows.map((r, i) => ({
      user_id: row.user_id,
      account_id: row.account_id,
      statement_import_id: importId,
      transaction_date: r.transactionDate,
      description: r.description,
      instrument_number: r.instrumentNumber,
      debit: r.debit,
      credit: r.credit,
      balance_after: r.balanceAfter,
      balance_source: r.balanceAfter != null ? ("stated" as const) : null,
      category: "Uncategorized",
      fingerprint: computeTransactionFingerprint({
        accountId: row.account_id,
        transactionDate: r.transactionDate,
        debit: r.debit,
        credit: r.credit,
        description: r.description,
        occurrenceIndex: occurrenceIndexes[i],
      }),
    }));

    // Defensive backstop: assignOccurrenceIndexes should already make every
    // fingerprint in this batch unique, but two rows colliding on identical
    // content from independently-extracted pages (e.g. a description
    // wrapping across a page boundary and getting picked up by both) is
    // exactly the kind of thing worth guarding rather than assuming away.
    // Identical fingerprints in one upsert array make ON CONFLICT DO
    // NOTHING behave unpredictably.
    const seenFingerprints = new Set<string>();
    const dedupedRows = dbRows.filter((r) => {
      if (seenFingerprints.has(r.fingerprint)) return false;
      seenFingerprints.add(r.fingerprint);
      return true;
    });

    // Insert before categorising: a categorisation failure should cost
    // categories, not the whole statement. The parse is durable the moment
    // this succeeds.
    const { data: insertedRows, error: insertError } = await supabase
      .from("bank_transactions")
      .upsert(dedupedRows, { onConflict: "account_id,fingerprint", ignoreDuplicates: true })
      .select("id, description");

    if (insertError) {
      return await fail(supabase, importId, `Couldn't save the extracted transactions: ${insertError.message}`);
    }

    const insertedCount = insertedRows?.length ?? 0;
    const duplicateCount = dedupedRows.length - insertedCount;

    if (insertedRows && insertedRows.length > 0) {
      const categories = await categorizeDescriptions(insertedRows.map((r) => r.description as string));
      const idsByCategory = new Map<string, string[]>();
      insertedRows.forEach((r, i) => {
        const category = categories[i];
        const ids = idsByCategory.get(category) ?? [];
        ids.push(r.id as string);
        idsByCategory.set(category, ids);
      });
      await Promise.all(
        [...idsByCategory.entries()].map(([category, ids]) => supabase.from("bank_transactions").update({ category }).in("id", ids))
      );
    }

    const noteParts = [summarizeValidation(validation)];
    if (untrustedCount > 0) noteParts.push(`${untrustedCount} row${untrustedCount === 1 ? "" : "s"} couldn't be verified against the page's own text.`);
    if (unparseableDateCount > 0) noteParts.push(`${unparseableDateCount} row${unparseableDateCount === 1 ? "" : "s"} had an unreadable date and were dropped.`);
    if (failedPages.length > 0) noteParts.push(`${failedPages.length} page${failedPages.length === 1 ? "" : "s"} couldn't be read at all.`);

    await supabase
      .from("bank_statement_imports")
      .update({
        status: "needs_review",
        period_start: facts.periodStart,
        period_end: facts.periodEnd,
        has_running_balance: facts.hasRunningBalance,
        opening_balance: facts.openingBalance,
        closing_balance: facts.closingBalance,
        parse_method: "vision",
        validation_ok: validation.ok && untrustedCount === 0,
        validation_note: noteParts.join(" "),
        error_message: null,
      })
      .eq("id", importId);

    return { ok: true, insertedCount, duplicateCount, totalExtracted: dedupedRows.length, validationOk: validation.ok && untrustedCount === 0 };
  } catch (err) {
    return await fail(supabase, importId, err instanceof Error ? err.message : String(err));
  }
}

async function fail(supabase: SupabaseClient, importId: string, error: string): Promise<{ ok: false; error: string }> {
  await supabase.from("bank_statement_imports").update({ status: "failed", error_message: error }).eq("id", importId);
  return { ok: false, error };
}
