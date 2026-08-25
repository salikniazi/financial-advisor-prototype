"use client";

import { useState } from "react";
import { FileUp, Sparkles, Loader2, X, FileText, Check, Pencil } from "lucide-react";
import { mockParseAsset, ParsedAsset } from "@/lib/ai/parseAsset";

type Step = "choose" | "upload" | "paste" | "parsing" | "review";

const mockFileNames = ["FD_certificate.pdf", "NSC_savings_certificate.pdf", "PF_statement_2026.pdf"];

export default function AddAssetFlow({ onClose, onAdd }: { onClose: () => void; onAdd: (item: ParsedAsset) => void }) {
  const [step, setStep] = useState<Step>("choose");
  const [pastedText, setPastedText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedAsset | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [editedName, setEditedName] = useState("");

  function startParsing(sourceText: string) {
    setStep("parsing");
    setTimeout(() => {
      const result = mockParseAsset(sourceText);
      setParsed(result);
      setEditedFields(result.fields);
      setEditedName(result.name);
      setStep("review");
    }, 1600);
  }

  function handleUploadClick() {
    const name = mockFileNames[Math.floor(Math.random() * mockFileNames.length)];
    setFileName(name);
    setTimeout(() => startParsing(name), 400);
  }

  function confirm() {
    if (!parsed) return;
    onAdd({
      ...parsed,
      name: editedName,
      fields: editedFields,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg text-ink">Add an Asset</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-muted mb-4">
                Add anything Lime doesn&apos;t track automatically — fixed deposits, savings certificates, provident funds, and more.
                Upload a document or describe it, and Lime will structure it for you.
              </p>
              <button
                onClick={() => setStep("upload")}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left hover:border-ink/30 hover:bg-cream"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow text-ink">
                  <FileUp size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Upload a document</span>
                  <span className="block text-xs text-muted">Certificate, statement, or PDF</span>
                </span>
              </button>
              <button
                onClick={() => setStep("paste")}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left hover:border-ink/30 hover:bg-cream"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-yellow">
                  <Pencil size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Type or paste the terms</span>
                  <span className="block text-xs text-muted">e.g. &ldquo;Fixed deposit with UBL, Rs 500,000 at 13%...&rdquo;</span>
                </span>
              </button>
            </div>
          )}

          {step === "upload" && (
            <div>
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border py-10 text-center">
                <FileUp size={28} className="text-muted" />
                <p className="text-sm text-muted">Drag a file here, or</p>
                <button onClick={handleUploadClick} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-yellow hover:opacity-90">
                  Choose a file
                </button>
              </div>
              {fileName && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm">
                  <FileText size={16} className="text-ink/60" />
                  {fileName}
                </div>
              )}
            </div>
          )}

          {step === "paste" && (
            <div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                placeholder="e.g. Fixed deposit with UBL, principal Rs 500,000, 13% profit rate, matures March 2027..."
                className="w-full rounded-2xl border border-border bg-cream p-4 text-sm outline-none focus:border-ink/30"
              />
              <button
                onClick={() => startParsing(pastedText || "fixed deposit")}
                disabled={!pastedText.trim()}
                className="mt-3 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-yellow hover:opacity-90 disabled:opacity-40"
              >
                <Sparkles size={14} /> Structure this with AI
              </button>
            </div>
          )}

          {step === "parsing" && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <Loader2 size={28} className="animate-spin text-yellow-dark" />
              <p className="text-sm font-semibold text-ink">Reading your document...</p>
              <p className="text-xs text-muted max-w-xs">Lime is extracting the key details and structuring them into fields you can confirm.</p>
            </div>
          )}

          {step === "review" && parsed && (
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-bg px-3 py-2.5 text-sm text-green">
                <Check size={16} /> Extracted successfully. Review and edit before saving.
              </div>
              <label className="mb-3 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Name</span>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
                />
              </label>
              <div className="space-y-3">
                {Object.entries(editedFields).map(([key, value]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{key}</span>
                    <input
                      value={value}
                      onChange={(e) => setEditedFields((f) => ({ ...f, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={confirm} className="flex-1 rounded-full bg-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-yellow-dark">
                  Confirm &amp; Save
                </button>
                <button onClick={onClose} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-cream">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
