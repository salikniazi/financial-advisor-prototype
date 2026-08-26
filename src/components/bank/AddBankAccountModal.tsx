"use client";

import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BankAccountRecord } from "@/lib/types";

const ACCOUNT_TYPES = ["Current Account", "Savings Account", "Fixed Deposit", "Wallet"];

export default function AddBankAccountModal({
  userId,
  onClose,
  onAdded,
}: {
  userId: string;
  onClose: () => void;
  onAdded: (account: BankAccountRecord) => void;
}) {
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
  const [nickname, setNickname] = useState("");
  const [accountNumberMasked, setAccountNumberMasked] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !bankName.trim()) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        bank_name: bankName.trim(),
        account_type: accountType,
        nickname: nickname.trim() || null,
        account_number_masked: accountNumberMasked.trim() || null,
        currency,
      })
      .select()
      .single();

    if (insertError || !data) {
      setSaving(false);
      setError(insertError?.message ?? "Couldn't save that account. Please try again.");
      return;
    }

    onAdded(data as BankAccountRecord);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg text-ink">Add a Bank Account</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Bank</span>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. UBL, Meezan Bank, SadaPay"
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Account Type</span>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Nickname (optional)</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Main salary account"
              className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
            />
          </label>

          <div className="grid grid-cols-[1fr_100px] gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Account No. (last 4, optional)</span>
              <input
                value={accountNumberMasked}
                onChange={(e) => setAccountNumberMasked(e.target.value)}
                placeholder="•••• 4821"
                maxLength={12}
                className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Currency</span>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-1.5 rounded-xl bg-red-bg px-3 py-2.5 text-xs text-red">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || !bankName.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving..." : "Save account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-cream"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
