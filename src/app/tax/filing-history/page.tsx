"use client";

import { Download, FileCheck2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { filingHistory } from "@/lib/mock/tax";
import { formatDate } from "@/lib/format";

const statusTone = { Filed: "green", Late: "yellow", "Not Filed": "red" } as const;

export default function FilingHistoryPage() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg text-ink">Filing History</h2>
        <p className="text-sm text-muted mt-0.5">Your past tax years, filed with your accountant through Lime.</p>
      </CardHeader>
      <CardBody className="!px-0">
        <div className="divide-y divide-border/70">
          {filingHistory.map((f) => (
            <div key={f.year} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/50">
                  <FileCheck2 size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{f.year}</p>
                  {f.filedDate && <p className="text-xs text-muted">Filed {formatDate(f.filedDate)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone[f.status]}>{f.status}</Badge>
                {f.status !== "Not Filed" && (
                  <button
                    onClick={() => alert(`Downloading ${f.year} return (mocked — no real PDF is generated in this prototype).`)}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-cream"
                  >
                    <Download size={13} /> View / Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
