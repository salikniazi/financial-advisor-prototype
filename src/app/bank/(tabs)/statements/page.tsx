"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FileUp, FileText, Loader2, AlertTriangle, Landmark } from "lucide-react";
import clsx from "clsx";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import AddBankAccountModal from "@/components/bank/AddBankAccountModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { BankAccountRecord, BankStatementImportRecord, BankStatementImportStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

type ImportRow = BankStatementImportRecord & {
  bank_accounts: { bank_name: string; nickname: string | null } | null;
};

const STATUS_TONE: Record<BankStatementImportStatus, "yellow" | "green" | "red" | "neutral" | "ink"> = {
  uploaded: "neutral",
  processing: "yellow",
  needs_review: "yellow",
  completed: "green",
  failed: "red",
};

// Stage A never produces anything but "uploaded" — the other labels are here
// for when Stage B starts actually moving statements through the pipeline.
const STATUS_LABEL: Record<BankStatementImportStatus, string> = {
  uploaded: "Uploaded — processing not yet available",
  processing: "Processing",
  needs_review: "Needs review",
  completed: "Completed",
  failed: "Failed",
};

export default function BankStatementsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([]);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ data: accountsData }, { data: importsData }] = await Promise.all([
      supabase.from("bank_accounts").select("*").order("created_at", { ascending: false }),
      supabase
        .from("bank_statement_imports")
        .select("*, bank_accounts(bank_name, nickname)")
        .order("uploaded_at", { ascending: false }),
    ]);
    setAccounts((accountsData as BankAccountRecord[] | null) ?? []);
    setImports((importsData as ImportRow[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // Sync with Supabase (an external system) on mount and whenever the
    // signed-in user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  function handleAccountAdded(account: BankAccountRecord) {
    setAccounts((prev) => [account, ...prev]);
    setSelectedAccountId(account.id);
    setShowAddAccount(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !user || !selectedAccountId) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("That file is larger than 15MB — please upload a smaller statement.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const importId = crypto.randomUUID();
    const filePath = `${user.id}/${importId}/${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("bank-statements")
      .upload(filePath, file, { contentType: "application/pdf", upsert: false });
    if (uploadErr) {
      setUploading(false);
      setUploadError(uploadErr.message);
      return;
    }

    const { error: insertErr } = await supabase.from("bank_statement_imports").insert({
      id: importId,
      user_id: user.id,
      account_id: selectedAccountId,
      file_path: filePath,
      file_name: file.name,
      status: "uploaded",
    });
    setUploading(false);
    if (insertErr) {
      setUploadError(insertErr.message);
      return;
    }

    await loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg text-ink">Accounts</h2>
            <p className="text-sm text-muted">Register the accounts you&apos;ll be uploading statements for.</p>
          </div>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-yellow hover:opacity-90"
          >
            <Plus size={16} /> Add account
          </button>
        </div>

        {accounts.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
              <Landmark size={28} className="text-muted" />
              <p className="text-sm font-semibold text-ink">No accounts yet</p>
              <p className="max-w-sm text-sm text-muted">Add a bank account before uploading a statement for it.</p>
              <button
                onClick={() => setShowAddAccount(true)}
                className="mt-1 rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-ink hover:bg-yellow-dark"
              >
                + Add your first account
              </button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <Card key={a.id}>
                <CardBody className="!pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{a.bank_name}</p>
                  <p className="mt-1 text-sm text-ink/70">{a.account_type}</p>
                  {a.nickname && <p className="text-xs text-muted">{a.nickname}</p>}
                  {a.account_number_masked && <p className="mt-1 text-xs text-muted">•••• {a.account_number_masked}</p>}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg text-ink">Upload a Statement</h2>
        <Card>
          <CardBody className="flex flex-col gap-4 !pt-5 sm:flex-row sm:items-center">
            <label className="block sm:w-64">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Account</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={accounts.length === 0}
                className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30 disabled:opacity-50"
              >
                {accounts.length === 0 && <option>Add an account first</option>}
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bank_name} — {a.nickname || a.account_type}
                  </option>
                ))}
              </select>
            </label>

            <label
              className={clsx(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-4 text-sm font-semibold text-muted transition-colors hover:border-ink/30 hover:text-ink",
                (accounts.length === 0 || uploading) && "pointer-events-none opacity-50"
              )}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
              {uploading ? "Uploading..." : "Choose a PDF statement"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                disabled={accounts.length === 0 || uploading}
                className="hidden"
              />
            </label>
          </CardBody>
        </Card>
        {uploadError && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-bg px-3 py-2.5 text-xs text-red">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">PDF only, up to 15MB. Reading the file&apos;s contents isn&apos;t implemented yet.</p>
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg text-ink">Uploaded Statements</h2>
        {imports.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center text-sm text-muted">No statements uploaded yet.</CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="!px-0 !pt-0">
              <div className="divide-y divide-border/70">
                {imports.map((imp) => (
                  <div key={imp.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-ink/60">
                        <FileText size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">{imp.file_name}</span>
                        <span className="block text-xs text-muted">
                          {imp.bank_accounts?.bank_name ?? "Unknown account"}
                          {imp.bank_accounts?.nickname ? ` · ${imp.bank_accounts.nickname}` : ""} · {formatDate(imp.uploaded_at)}
                        </span>
                      </span>
                    </div>
                    <Badge tone={STATUS_TONE[imp.status]}>{STATUS_LABEL[imp.status]}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {showAddAccount && user && (
        <AddBankAccountModal userId={user.id} onClose={() => setShowAddAccount(false)} onAdded={handleAccountAdded} />
      )}
    </div>
  );
}
