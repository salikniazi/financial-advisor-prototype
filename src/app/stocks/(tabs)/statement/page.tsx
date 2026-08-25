import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { stockTradeHistory } from "@/lib/mock/stocks";
import { formatPKR, formatDate, formatNumber } from "@/lib/format";
import clsx from "clsx";

export default function StocksStatementPage() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg text-ink">Account Statement</h2>
        <p className="text-sm text-muted mt-0.5">Trade history, including buys, sells, and dividend payouts.</p>
      </CardHeader>
      <CardBody className="!px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">Type</th>
                <th className="px-5 py-2.5 font-semibold">Ticker</th>
                <th className="px-5 py-2.5 font-semibold text-right">Shares</th>
                <th className="px-5 py-2.5 font-semibold text-right">Price</th>
                <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {stockTradeHistory.map((t, i) => (
                <tr key={i} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-3 text-ink/70">{formatDate(t.date)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.type === "Buy" ? "green" : t.type === "Sell" ? "red" : "yellow"}>{t.type}</Badge>
                  </td>
                  <td className="px-5 py-3 font-semibold">{t.ticker}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.shares ? formatNumber(t.shares) : "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.price ? formatPKR(t.price, { decimals: 2 }) : "—"}</td>
                  <td className={clsx("px-5 py-3 text-right font-semibold tabular-nums", t.type === "Sell" || t.type === "Dividend" ? "text-green" : "text-ink")}>
                    {t.type === "Buy" ? "-" : "+"}
                    {formatPKR(t.amount)}
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
