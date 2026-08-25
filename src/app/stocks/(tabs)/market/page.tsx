"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PercentChange } from "@/components/ui/Badge";
import { marketMoversGainers, marketMoversLosers, sectorPerformance } from "@/lib/mock/stocks";
import { formatPKR } from "@/lib/format";
import clsx from "clsx";

function MoverList({ title, items, icon, tone }: { title: string; items: typeof marketMoversGainers; icon: React.ReactNode; tone: "green" | "red" }) {
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
              key={item.ticker}
              onClick={() => router.push(`/stocks/${item.ticker}`)}
              className="flex cursor-pointer items-center justify-between py-3 hover:bg-cream/50 -mx-2 px-2 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold", tone === "green" ? "bg-green-bg text-green" : "bg-red-bg text-red")}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{item.ticker}</p>
                  <p className="text-xs text-muted">{item.name}</p>
                </div>
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

export default function StocksMarketPage() {
  const maxAbs = Math.max(...sectorPerformance.map((s) => Math.abs(s.changePct)));
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <MoverList title="Top Gainers Today" items={marketMoversGainers} icon={<TrendingUp size={18} className="text-green" />} tone="green" />
        <MoverList title="Top Losers Today" items={marketMoversLosers} icon={<TrendingDown size={18} className="text-red" />} tone="red" />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg text-ink">Sector Performance Today</h2>
        </CardHeader>
        <CardBody className="space-y-2.5">
          {sectorPerformance.map((s) => {
            const positive = s.changePct >= 0;
            const widthPct = (Math.abs(s.changePct) / maxAbs) * 100;
            return (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="w-52 shrink-0 truncate text-sm text-ink/80">{s.sector}</span>
                <div className="relative h-6 flex-1 rounded-md bg-cream overflow-hidden">
                  <div
                    className={clsx("h-full rounded-md", positive ? "bg-green" : "bg-red")}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className={clsx("w-16 shrink-0 text-right text-sm font-semibold tabular-nums", positive ? "text-green" : "text-red")}>
                  {positive ? "+" : ""}
                  {s.changePct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
