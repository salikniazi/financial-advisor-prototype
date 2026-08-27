"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BankTransactionRecord } from "@/lib/types";
import { BANK_CATEGORY_GROUPS } from "@/lib/bank/categories";
import { formatDate, formatPKR } from "@/lib/format";

export default function ReviewStatementModal({
  importId,
  fileName,
  accountLabel,
  onClose,
  onUpdated,
}: {
  importId: string;
  fileName: string;
  accountLabel: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [transactions, setTransactions] = useState<BankTransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("bank_transactions")
        .select("*")
        .eq("statement_import_id", importId)
        .order("transaction_date", { ascending: true });
      if (!cancelled) {
        setTransactions((data as BankTransactionRecord[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [importId]);

  async function updateCategory(id: string, category: string) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category, reviewed: true } : t)));
    const supabase = createClient();
    await supabase.from("bank_transactions").update({ category, reviewed: true }).eq("id", id);
  }

  async function toggleReviewed(id: string, reviewed: boolean) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, reviewed } : t)));
    const supabase = createClient();
    await supabase.from("bank_transactions").update({ reviewed }).eq("id", id);
  }

  async function confirmAll() {
    setConfirming(true);
    const supabase = createClient();
    await supabase.from("bank_transactions").update({ reviewed: true }).eq("statement_import_id", importId);
    await supabase.from("bank_statement_imports").update({ status: "completed" }).eq("id", importId);
    setConfirming(false);
    onUpdated();
    onClose();
  }

  const reviewedCount = transactions.filter((t) => t.reviewed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-lg text-ink">Review Statement</h2>
            <p className="text-xs text-muted">
              {fileName} · {accountLabel}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">No transactions found for this statement.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-2.5 font-semibold">Date</th>
                    <th className="px-5 py-2.5 font-semibold">Description</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Debit</th>
                    <th className="px-5 py-2.5 font-semibold text-right">Credit</th>
                    <th className="px-5 py-2.5 font-semibold">Category</th>
                    <th className="px-5 py-2.5 font-semibold text-center">Reviewed</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/70 last:border-b-0">
                      <td className="whitespace-nowrap px-5 py-3 text-ink/70">{formatDate(t.transaction_date)}</td>
                      <td className="max-w-xs px-5 py-3 text-ink" title={t.description}>
                        <span className="line-clamp-2">{t.description}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-red">
                        {t.debit != null ? formatPKR(t.debit) : ""}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-green">
                        {t.credit != null ? formatPKR(t.credit) : ""}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={t.category ?? "Uncategorized"}
                          onChange={(e) => updateCategory(t.id, e.target.value)}
                          className="w-full rounded-lg border border-border bg-cream px-2 py-1.5 text-xs outline-none focus:border-ink/30"
                        >
                          {BANK_CATEGORY_GROUPS.map((g) => (
                            <optgroup key={g.group} label={g.group}>
                              {g.categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={t.reviewed}
                          onChange={(e) => toggleReviewed(t.id, e.target.checked)}
                          className="h-4 w-4 accent-yellow-dark"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className="text-xs text-muted">
            {reviewedCount} of {transactions.length} reviewed
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-cream">
              Skip for now
            </button>
            <button
              onClick={confirmAll}
              disabled={confirming || transactions.length === 0}
              className="flex items-center gap-2 rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-ink hover:bg-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Confirm all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
