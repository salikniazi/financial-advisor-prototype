"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SlidersHorizontal } from "lucide-react";

export type ScreenerFilter = { label: string; options: string[] };

export default function Screener({ title, filters }: { title: string; filters: ScreenerFilter[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2 !pb-3">
        <SlidersHorizontal size={16} className="text-muted" />
        <h2 className="font-heading text-base text-ink">{title}</h2>
      </CardHeader>
      <CardBody className="!pt-0">
        <div className="flex flex-wrap gap-2.5">
          {filters.map((f) => (
            <label key={f.label} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{f.label}</span>
              <select className="rounded-lg border border-border bg-cream px-3 py-1.5 text-sm text-ink outline-none focus:border-ink/30">
                <option>Any</option>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Filters are illustrative in this prototype and don&apos;t yet affect results.</p>
      </CardBody>
    </Card>
  );
}
