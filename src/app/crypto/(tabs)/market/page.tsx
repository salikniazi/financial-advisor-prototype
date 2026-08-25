"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PercentChange } from "@/components/ui/Badge";
import { cryptoMoversGainers, cryptoMoversLosers, dominanceBreakdown } from "@/lib/mock/crypto";
import { formatPKR } from "@/lib/format";
import clsx from "clsx";

const dominanceColors: Record<string, string> = {
  BTC: "#0A0A0A",
  ETH: "#6b6455",
  Stablecoins: "#1F8A4C",
  Altcoins: "#FFD84D",
};

function MoverList({ title, items, icon, tone }: { title: string; items: typeof cryptoMoversGainers; icon: React.ReactNode; tone: "green" | "red" }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader className="flex items-center gap-2 !pb-2">
        {icon}
        <h2 className="font-heading text-lg text-ink">{title}</h2>
      </CardHeader>
      <CardBody className="!pt-0">
        <div className="divide-y divide-border/70">
          {items.map((item, i) => (
            <div
              key={item.symbol}
              onClick={() => router.push(`/crypto/${item.symbol}`)}
              className="flex cursor-pointer items-center justify-between py-3 hover:bg-cream/50 -mx-2 px-2 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", tone === "green" ? "bg-green-bg text-green" : "bg-red-bg text-red")}>
                  {i + 1}
                </span>
                <p className="text-sm font-bold text-ink">{item.symbol}</p>
                <p className="text-xs text-muted">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums font-medium">{formatPKR(item.price, { decimals: 2 })}</p>
                <PercentChange percent={item.changePct} />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default function CryptoMarketPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <MoverList title="Top Gainers (24h)" items={cryptoMoversGainers} icon={<TrendingUp size={18} className="text-green" />} tone="green" />
        <MoverList title="Top Losers (24h)" items={cryptoMoversLosers} icon={<TrendingDown size={18} className="text-red" />} tone="red" />
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <PieChart size={18} className="text-muted" />
          <h2 className="font-heading text-lg text-ink">Market Cap Breakdown</h2>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full">
            {dominanceBreakdown.map((d) => (
              <div key={d.label} style={{ width: `${d.pct}%`, backgroundColor: dominanceColors[d.label] }} title={`${d.label} ${d.pct}%`} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {dominanceBreakdown.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dominanceColors[d.label] }} />
                <span className="text-sm text-ink/80">{d.label}</span>
                <span className="ml-auto text-sm font-semibold">{d.pct}%</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
