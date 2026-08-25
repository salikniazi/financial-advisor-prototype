"use client";

import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import TrendChart from "@/components/charts/TrendChart";
import { GainLoss } from "@/components/ui/Badge";
import { stockHoldings } from "@/lib/mock/stocks";
import { formatPKR, formatNumber } from "@/lib/format";
import { lastMonths } from "@/lib/mock/months";

export default function StocksPortfolioPage() {
  const router = useRouter();
  const months = lastMonths(12);

  const rows = stockHoldings
    .map((h) => {
      const value = h.shares * h.price;
      const costBasis = h.shares * h.avgCost;
      const gain = value - costBasis;
      const gainPct = costBasis === 0 ? 0 : (gain / costBasis) * 100;
      return { ...h, value, gain, gainPct };
    })
    .sort((a, b) => b.value - a.value);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.shares * r.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost === 0 ? 0 : (totalGain / totalCost) * 100;

  const combinedHistory = months.map((month, i) => ({
    month,
    value: rows.reduce((s, r) => s + (r.history[i]?.value ?? 0), 0),
  }));
  const monthChange = combinedHistory[0].value - (combinedHistory[1]?.value ?? combinedHistory[0].value);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Portfolio Value</p>
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
          <h2 className="font-heading text-lg text-ink">Holdings</h2>
        </CardHeader>
        <CardBody className="!px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Ticker</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Shares</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Avg Cost</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Price</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Value</th>
                  <th className="px-5 py-2.5 font-semibold text-right">Gain/Loss</th>
                  <th className="px-5 py-2.5 font-semibold text-right">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.ticker}
                    onClick={() => router.push(`/stocks/${r.ticker}`)}
                    className="cursor-pointer border-b border-border/70 last:border-b-0 hover:bg-cream/70"
                  >
                    <td className="px-5 py-3">
                      <p className="font-bold text-ink">{r.ticker}</p>
                      <p className="text-xs text-muted">{r.name}</p>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatNumber(r.shares)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatPKR(r.avgCost, { decimals: 2 })}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatPKR(r.price, { decimals: 2 })}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatPKR(r.value)}</td>
                    <td className="px-5 py-3 text-right"><GainLoss value={r.gain} percent={r.gainPct} /></td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink/70">
                      {((r.value / totalValue) * 100).toFixed(1)}%
                    </td>
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
