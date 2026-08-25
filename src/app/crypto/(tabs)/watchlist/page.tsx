"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PercentChange } from "@/components/ui/Badge";
import { cryptoWatchlist } from "@/lib/mock/crypto";
import { formatPKR } from "@/lib/format";

export default function CryptoWatchlistPage() {
  const router = useRouter();
  const [removed, setRemoved] = useState<string[]>([]);
  const list = cryptoWatchlist.filter((w) => !removed.includes(w.symbol));

  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-lg text-ink flex items-center gap-2">
          <Star size={18} className="text-yellow-dark" fill="#F0C528" /> Watchlist
        </h2>
      </CardHeader>
      <CardBody className="!px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2.5 font-semibold">Coin</th>
                <th className="px-5 py-2.5 font-semibold text-right">Price</th>
                <th className="px-5 py-2.5 font-semibold text-right">Day Change</th>
                <th className="px-5 py-2.5 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.symbol} className="border-b border-border/70 last:border-b-0 hover:bg-cream/70">
                  <td className="cursor-pointer px-5 py-3" onClick={() => router.push(`/crypto/${w.symbol}`)}>
                    <p className="font-bold text-ink">{w.symbol}</p>
                    <p className="text-xs text-muted">{w.name}</p>
                  </td>
                  <td className="cursor-pointer px-5 py-3 text-right tabular-nums" onClick={() => router.push(`/crypto/${w.symbol}`)}>
                    {formatPKR(w.price, { decimals: 2 })}
                  </td>
                  <td className="cursor-pointer px-5 py-3 text-right" onClick={() => router.push(`/crypto/${w.symbol}`)}>
                    <PercentChange percent={w.dayChangePct} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setRemoved((r) => [...r, w.symbol])} className="text-muted hover:text-red" aria-label={`Remove ${w.symbol}`}>
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                    Your watchlist is empty.
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
