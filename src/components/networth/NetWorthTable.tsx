"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CategoryRow, MonthPoint } from "@/lib/types";
import { formatCompactPKR, formatMonthShort } from "@/lib/format";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { Plus, ChevronRight } from "lucide-react";

function CellValue({ value, isLiability, isOthers }: { value: number; isLiability?: boolean; isOthers?: boolean }) {
  if (isOthers) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/50 group-hover:text-ink">
        <Plus size={12} /> Add asset
      </span>
    );
  }
  if (value === 0) {
    return <span className="text-sm text-muted">Rs 0</span>;
  }
  return (
    <span className={clsx("text-sm font-semibold tabular-nums", isLiability ? "text-red" : "text-ink")}>
      {isLiability ? "-" : ""}
      {formatCompactPKR(value).replace("Rs -", "Rs ")}
    </span>
  );
}

function Row({ row, months }: { row: CategoryRow; months: string[] }) {
  const router = useRouter();
  const isOthers = row.key === "others";
  return (
    <tr
      className="group cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-cream/70"
      onClick={() => router.push(row.href)}
    >
      <td className="sticky left-0 z-10 min-w-[180px] border-r border-border bg-card px-4 py-3.5 group-hover:bg-cream/70">
        <span className="flex items-center gap-1.5">
          <span className={clsx("text-sm font-semibold", row.isLiability && "text-red")}>{row.label}</span>
          <InfoTooltip description={row.description} source={row.source} />
          <ChevronRight size={14} className="ml-auto text-ink/20 group-hover:text-ink/50" />
        </span>
      </td>
      {months.map((month) => {
        const point = row.history.find((h) => h.month === month);
        return (
          <td key={month} className="px-4 py-3.5 text-right">
            <CellValue value={point?.value ?? 0} isLiability={row.isLiability} isOthers={isOthers} />
          </td>
        );
      })}
    </tr>
  );
}

export default function NetWorthTable({
  months,
  assetRows,
  liabilityRows,
  netWorthSeries,
}: {
  months: string[];
  assetRows: CategoryRow[];
  liabilityRows: CategoryRow[];
  netWorthSeries: MonthPoint[];
}) {
  return (
    <div className="mx-4 sm:mx-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-ink text-white">
              <th className="sticky left-0 z-30 min-w-[180px] border-r border-ink bg-ink px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Category
              </th>
              {months.map((month, i) => (
                <th
                  key={month}
                  className={clsx(
                    "min-w-[110px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide",
                    i === 0 && "text-yellow"
                  )}
                >
                  {formatMonthShort(month)}
                </th>
              ))}
            </tr>
            <tr className="sticky top-[41px] z-20 bg-yellow">
              <td className="sticky left-0 z-30 border-r border-ink/10 bg-yellow px-4 py-3 text-sm font-heading text-ink">
                Net Worth
              </td>
              {months.map((month) => {
                const point = netWorthSeries.find((p) => p.month === month);
                return (
                  <td key={month} className="px-4 py-3 text-right text-sm font-bold tabular-nums text-ink">
                    {formatCompactPKR(point?.value ?? 0)}
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={months.length + 1} className="sticky left-0 bg-cream px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                Assets
              </td>
            </tr>
            {assetRows.map((row) => (
              <Row key={row.key} row={row} months={months} />
            ))}
            <tr>
              <td colSpan={months.length + 1} className="sticky left-0 bg-cream px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                Liabilities
              </td>
            </tr>
            {liabilityRows.map((row) => (
              <Row key={row.key} row={row} months={months} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
