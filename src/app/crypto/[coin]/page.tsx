import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import TimeframePriceChart from "@/components/charts/TimeframePriceChart";
import { getCoinDetail, cryptoNews, EXCHANGE_NAME } from "@/lib/mock/crypto";
import { formatPKR } from "@/lib/format";

export default async function CoinDetailPage({ params }: PageProps<"/crypto/[coin]">) {
  const { coin } = await params;
  const detail = getCoinDetail(coin);
  if (!detail) notFound();
  const { meta, holding, price } = detail;

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/crypto" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Crypto
      </Link>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{meta.category}</p>
          <h1 className="font-heading text-3xl text-ink mt-1">
            {meta.symbol} <span className="text-lg font-body font-medium text-ink/60">{meta.name}</span>
          </h1>
          <p className="mt-2 font-heading text-2xl text-ink">{formatPKR(price, { decimals: 2 })}</p>
        </div>
      </div>

      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-xs font-medium text-muted">
        <ShieldCheck size={13} /> Data sourced from {EXCHANGE_NAME}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <TimeframePriceChart currentPrice={price} seed={meta.symbol.length * 9} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Key Stats</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Market Cap" value={`$${formatCompactUsd(meta.marketCapUsd)}`} />
              <Stat label="24h Volume" value={`$${formatCompactUsd(meta.volume24hUsd)}`} />
              <Stat label="Circulating Supply" value={meta.circulatingSupply} />
              <Stat label="Category" value={meta.category} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Recent News</h2>
            </CardHeader>
            <CardBody className="!pt-0">
              <div className="divide-y divide-border/70">
                {cryptoNews.slice(0, 3).map((n) => (
                  <div key={n.headline} className="py-3">
                    <p className="text-sm font-medium text-ink leading-snug">{n.headline}</p>
                    <p className="mt-1 text-xs text-muted">
                      {n.source} · {n.time}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Your Position</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {holding ? (
                <>
                  <Stat label="Amount Held" value={holding.amount.toLocaleString("en-PK", { maximumFractionDigits: 4 })} />
                  <Stat label="Avg Cost" value={formatPKR(holding.avgCost, { decimals: 2 })} />
                  <Stat label="Current Value" value={formatPKR(holding.amount * holding.price)} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Gain / Loss</p>
                    <GainLoss
                      value={holding.amount * holding.price - holding.amount * holding.avgCost}
                      percent={((holding.price - holding.avgCost) / holding.avgCost) * 100}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">You don&apos;t currently hold this coin.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatCompactUsd(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return v.toLocaleString();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
