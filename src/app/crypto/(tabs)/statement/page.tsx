import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ShieldCheck } from "lucide-react";
import { cryptoTradeHistory, EXCHANGE_NAME } from "@/lib/mock/crypto";
import { formatPKR, formatDate } from "@/lib/format";
import clsx from "clsx";

const toneFor: Record<string, "green" | "red" | "yellow"> = {
  Buy: "green",
  Sell: "red",
  "Transfer In": "yellow",
  "Transfer Out": "yellow",
};

export default function CryptoStatementPage() {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg text-ink">Account Statement</h2>
        <p className="text-sm text-muted mt-0.5">Buys, sells, and wallet-to-wallet transfers.</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-muted">
          <ShieldCheck size={13} /> Data sourced from {EXCHANGE_NAME}
        </div>
      </CardHeader>
      <CardBody className="!px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">Type</th>
                <th className="px-5 py-2.5 font-semibold">Coin</th>
                <th className="px-5 py-2.5 font-semibold text-right">Amount</th>
                <th className="px-5 py-2.5 font-semibold text-right">Price</th>
                <th className="px-5 py-2.5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cryptoTradeHistory.map((t, i) => (
                <tr key={i} className="border-b border-border/70 last:border-b-0">
                  <td className="px-5 py-3 text-ink/70">{formatDate(t.date)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={toneFor[t.type] ?? "neutral"}>{t.type}</Badge>
                  </td>
                  <td className="px-5 py-3 font-semibold">{t.symbol}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{t.amount.toLocaleString("en-PK", { maximumFractionDigits: 4 })}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatPKR(t.price, { decimals: 2 })}</td>
                  <td className={clsx("px-5 py-3 text-right font-semibold tabular-nums", t.type.startsWith("Sell") || t.type.startsWith("Transfer Out") ? "text-red" : "text-green")}>
                    {t.type.startsWith("Sell") || t.type.startsWith("Transfer Out") ? "-" : "+"}
                    {formatPKR(t.total)}
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
