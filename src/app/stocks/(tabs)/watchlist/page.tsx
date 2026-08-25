"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PercentChange } from "@/components/ui/Badge";
import { stockWatchlist, stockUniverse } from "@/lib/mock/stocks";
import { formatPKR } from "@/lib/format";

export default function StocksWatchlistPage() {
  const router = useRouter();
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);

  const list = [
    ...stockWatchlist.filter((w) => !removed.includes(w.ticker)),
    ...added
      .filter((t) => !stockWatchlist.some((w) => w.ticker === t))
      .map((t) => {
        const m = stockUniverse.find((s) => s.ticker === t)!;
        return { ticker: t, name: m.name, sector: m.sector, price: 100, dayChangePct: 0 };
      }),
  ];

  const availableToAdd = stockUniverse.filter(
    (s) => !list.some((w) => w.ticker === s.ticker)
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="font-heading text-lg text-ink flex items-center gap-2">
          <Star size={18} className="text-yellow-dark" fill="#F0C528" /> Watchlist
        </h2>
        {availableToAdd.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-yellow hover:opacity-90">
              <Plus size={14} /> Add stock
            </button>
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg group-hover:block">
              {availableToAdd.slice(0, 6).map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => setAdded((a) => [...a, s.ticker])}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium hover:bg-cream"
                >
                  <span>{s.ticker}</span>
                  <span className="text-muted truncate ml-2">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardBody className="!px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Ticker</th>
                <th className="px-5 py-2.5 font-semibold">Sector</th>
                <th className="px-5 py-2.5 font-semibold text-right">Price</th>
                <th className="px-5 py-2.5 font-semibold text-right">Day Change</th>
                <th className="px-5 py-2.5 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.ticker} className="border-b border-border/70 last:border-b-0 hover:bg-cream/70">
                  <td className="cursor-pointer px-5 py-3" onClick={() => router.push(`/stocks/${w.ticker}`)}>
                    <p className="font-bold text-ink">{w.ticker}</p>
                    <p className="text-xs text-muted">{w.name}</p>
                  </td>
                  <td className="cursor-pointer px-5 py-3 text-ink/70" onClick={() => router.push(`/stocks/${w.ticker}`)}>
                    {w.sector}
                  </td>
                  <td className="cursor-pointer px-5 py-3 text-right tabular-nums" onClick={() => router.push(`/stocks/${w.ticker}`)}>
                    {formatPKR(w.price, { decimals: 2 })}
                  </td>
                  <td className="cursor-pointer px-5 py-3 text-right" onClick={() => router.push(`/stocks/${w.ticker}`)}>
                    <PercentChange percent={w.dayChangePct} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setRemoved((r) => [...r, w.ticker])}
                      className="text-muted hover:text-red"
                      aria-label={`Remove ${w.ticker} from watchlist`}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    Your watchlist is empty. Add stocks to track them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
