"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";
import clsx from "clsx";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { filingSections as initialSections, reconciliation, FilingLine } from "@/lib/mock/tax";
import { formatPKR, formatNumber } from "@/lib/format";
import { useTaxStatus } from "./TaxStatusProvider";

type EditableLine = FilingLine & { remarksText: string };
type EditableSection = { key: string; title: string; lines: EditableLine[] };

function LineRow({ line, onChange }: { line: EditableLine; onChange: (next: EditableLine) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/70 py-3.5 last:border-b-0 sm:grid-cols-[1fr_170px_110px]">
      <div className="flex items-center gap-2">
        {line.status === "auto" ? (
          <CheckCircle2 size={15} className="shrink-0 text-green" />
        ) : (
          <AlertTriangle size={15} className="shrink-0 text-yellow-dark" />
        )}
        <div>
          <p className="text-sm font-medium text-ink">{line.label}</p>
          {line.source && <p className="text-xs text-muted">{line.source}</p>}
        </div>
      </div>
      <input
        value={line.remarksText}
        onChange={(e) => onChange({ ...line, remarksText: e.target.value })}
        placeholder="Remark for accountant"
        className="rounded-lg border border-border bg-cream px-2.5 py-1.5 text-xs outline-none focus:border-ink/30"
      />
      <input
        type="text"
        inputMode="numeric"
        value={line.value === 0 && line.status === "needs-input" ? "" : formatNumber(line.value)}
        onChange={(e) => onChange({ ...line, value: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 })}
        placeholder={line.status === "needs-input" ? "Enter amount" : undefined}
        className={clsx(
          "rounded-lg border px-2.5 py-1.5 text-right text-sm font-semibold tabular-nums outline-none focus:border-ink/30",
          line.status === "needs-input" ? "border-yellow-dark/50 bg-yellow/10" : "border-border bg-cream"
        )}
      />
    </div>
  );
}

export default function FilingForm() {
  const { status, submit } = useTaxStatus();
  const [sections, setSections] = useState<EditableSection[]>(() =>
    initialSections.map((s) => ({ ...s, lines: s.lines.map((l) => ({ ...l, remarksText: l.remarks ?? "" })) }))
  );

  const needsInputCount = useMemo(
    () => sections.reduce((sum, s) => sum + s.lines.filter((l) => l.status === "needs-input" && l.value === 0).length, 0),
    [sections]
  );

  const totalAssets = useMemo(
    () =>
      sections
        .filter((s) => s.key !== "liabilities")
        .reduce((sum, s) => sum + s.lines.reduce((ls, l) => ls + l.value, 0), 0),
    [sections]
  );
  const totalLiabilities = useMemo(() => {
    const s = sections.find((sec) => sec.key === "liabilities");
    return s ? s.lines.reduce((sum, l) => sum + l.value, 0) : 0;
  }, [sections]);

  function updateLine(sectionKey: string, index: number, next: EditableLine) {
    setSections((prev) =>
      prev.map((s) => (s.key === sectionKey ? { ...s, lines: s.lines.map((l, i) => (i === index ? next : l)) } : s))
    );
  }

  const netInflow = reconciliation.inflows.reduce((s, i) => s + i.value, 0);
  const netOutflow = reconciliation.outflows.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader className="flex items-center justify-between !pb-2">
            <h2 className="font-heading text-lg text-ink">{section.title}</h2>
            <span className="text-sm font-semibold text-ink/70">
              {formatPKR(section.lines.reduce((s, l) => s + l.value, 0))}
            </span>
          </CardHeader>
          <CardBody className="!pt-0">
            <div className="hidden sm:grid grid-cols-[1fr_170px_110px] gap-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <span>Line Item</span>
              <span>Remarks</span>
              <span className="text-right">Amount (Rs)</span>
            </div>
            {section.lines.map((line, i) => (
              <LineRow key={line.label} line={line} onChange={(next) => updateLine(section.key, i, next)} />
            ))}
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg text-ink">Reconciliation of Net Assets</h2>
          <p className="text-sm text-muted mt-0.5">Auto-computed from your net worth trend, plus inflows and outflows for the year.</p>
        </CardHeader>
        <CardBody className="!pt-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-cream p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Net Assets — This Year</p>
              <p className="mt-1 font-heading text-lg text-ink">{formatPKR(reconciliation.netAssetsThisYear)}</p>
            </div>
            <div className="rounded-xl bg-cream p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Net Assets — Last Year</p>
              <p className="mt-1 font-heading text-lg text-ink">{formatPKR(reconciliation.netAssetsLastYear)}</p>
            </div>
            <div className="rounded-xl bg-yellow/20 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Increase in Net Assets</p>
              <p className="mt-1 font-heading text-lg text-ink">
                {formatPKR(reconciliation.netAssetsThisYear - reconciliation.netAssetsLastYear)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Inflows</p>
              <div className="space-y-1.5">
                {reconciliation.inflows.map((f) => (
                  <div key={f.label} className="flex justify-between text-sm">
                    <span className="text-ink/70">{f.label}</span>
                    <span className="font-medium tabular-nums text-green">+{formatPKR(f.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-semibold">
                  <span>Total Inflows</span>
                  <span className="tabular-nums text-green">+{formatPKR(netInflow)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Outflows / Personal Expenses</p>
              <div className="space-y-1.5">
                {reconciliation.outflows.map((f) => (
                  <div key={f.label} className="flex justify-between text-sm">
                    <span className="text-ink/70">{f.label}</span>
                    <span className="font-medium tabular-nums text-red">-{formatPKR(f.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-semibold">
                  <span>Total Outflows</span>
                  <span className="tabular-nums text-red">-{formatPKR(netOutflow)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col items-end gap-2 rounded-2xl border border-border bg-card p-5">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink/70">
            Total Assets: <span className="font-semibold text-ink">{formatPKR(totalAssets)}</span> · Total Liabilities:{" "}
            <span className="font-semibold text-red">{formatPKR(totalLiabilities)}</span>
            {needsInputCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-yellow-dark font-semibold">
                <AlertTriangle size={13} /> {needsInputCount} line{needsInputCount > 1 ? "s" : ""} need input
              </span>
            )}
          </div>
          <button
            onClick={submit}
            disabled={status !== "Draft"}
            className="flex items-center gap-2 rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-ink hover:bg-yellow-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} />
            {status === "Draft" ? "Submit for Review" : status === "Under Review" ? "Submitted — Under Review" : "Filed"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Submitting hands your return off to your accountant for review and filing with FBR — this isn&apos;t a self-filed submission.
        </p>
      </div>
    </div>
  );
}
