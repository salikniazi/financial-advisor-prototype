"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge, { PercentChange } from "@/components/ui/Badge";
import { mutualFunds } from "@/lib/mock/mutualFunds";
import { formatPKR } from "@/lib/format";

const riskTone = { Low: "green", Moderate: "yellow", High: "red" } as const;

type SortKey = "return1Y" | "return1M" | "nav";

export default function ExploreFundsPage() {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("return1Y");

  const sorted = useMemo(() => [...mutualFunds].sort((a, b) => b[sortKey] - a[sortKey]), [sortKey]);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg text-ink">Explore Funds</h2>
          <p className="text-sm text-muted mt-0.5">Compare funds available across AMCs. Sort to see which ones are performing well.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <ArrowUpDown size={13} /> Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-cream px-2 py-1 text-xs text-ink outline-none"
          >
            <option value="return1Y">1Y Return</option>
            <option value="return1M">1M Return</option>
            <option value="nav">NAV</option>
          </select>
        </div>
      </CardHeader>
      <CardBody className="!px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Fund</th>
                <th className="px-5 py-2.5 font-semibold">Category</th>
                <th className="px-5 py-2.5 font-semibold text-right">NAV</th>
                <th className="px-5 py-2.5 font-semibold text-right">1M Return</th>
                <th className="px-5 py-2.5 font-semibold text-right">1Y Return</th>
                <th className="px-5 py-2.5 font-semibold text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => router.push(`/mutual-funds/${f.id}`)}
                  className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-cream/70"
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-ink">{f.name}</p>
                    <p className="text-xs text-muted">{f.amc}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="neutral">{f.category}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPKR(f.nav, { decimals: 2 })}</td>
                  <td className="px-5 py-3 text-right"><PercentChange percent={f.return1M} /></td>
                  <td className="px-5 py-3 text-right"><PercentChange percent={f.return1Y} /></td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone={riskTone[f.riskRating]}>{f.riskRating}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
