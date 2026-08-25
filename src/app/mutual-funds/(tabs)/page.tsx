"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import Badge from "@/components/ui/Badge";
import TrendChart from "@/components/charts/TrendChart";
import { mutualFundHoldings, mutualFunds } from "@/lib/mock/mutualFunds";
import { formatPKR, formatNumber } from "@/lib/format";
import { lastMonths } from "@/lib/mock/months";

export default function MyHoldingsPage() {
  const router = useRouter();
  const months = lastMonths(12);

  const rows = mutualFundHoldings.map((h) => {
    const fund = mutualFunds.find((f) => f.id === h.fundId)!;
    const value = h.units * fund.nav;
    const costBasis = h.units * h.avgCost;
    const gain = value - costBasis;
    const gainPct = costBasis === 0 ? 0 : (gain / costBasis) * 100;
    return { fund, units: h.units, avgCost: h.avgCost, value, gain, gainPct };
  });

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.units * r.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost === 0 ? 0 : (totalGain / totalCost) * 100;

  const combinedHistory = months.map((month, i) => ({
    month,
    value: rows.reduce((s, r) => {
      const point = r.fund.history[i];
      return s + (point ? point.value * r.units : 0);
    }, 0),
  }));
  const monthChange = combinedHistory[0].value - (combinedHistory[1]?.value ?? combinedHistory[0].value);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Value</p>
          <p className="font-heading text-3xl text-ink mt-1">{formatPKR(totalValue)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span>
              Total gain: <GainLoss value={totalGain} percent={totalGainPct} />
            </span>
            <span className="text-muted">·</span>
            <span>
              This month: <GainLoss value={monthChange} />
            </span>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="!pb-0">
          <h2 className="font-heading text-lg text-ink">Value Over Time</h2>
        </CardHeader>
        <CardBody>
          <TrendChart data={combinedHistory} color="#0A0A0A" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg text-ink">Your Funds</h2>
        </CardHeader>
        <CardBody className="!px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Fund</th>
                  <th className="px-5 py-2.5 font-semibold">Category</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Units Held</th>
                  <th className="px-5 py-2.5 font-semibold text-right">NAV</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Value</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.fund.id}
                    onClick={() => router.push(`/mutual-funds/${r.fund.id}`)}
                    className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-cream/70"
                  >
                    <td className="px-5 py-3">
                      <p className="font-bold text-ink">{r.fund.name}</p>
                      <p className="text-xs text-muted">{r.fund.amc}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="neutral">{r.fund.category}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.units)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatPKR(r.fund.nav, { decimals: 2 })}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatPKR(r.value)}</td>
                    <td className="px-5 py-3 text-right"><GainLoss value={r.gain} percent={r.gainPct} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
