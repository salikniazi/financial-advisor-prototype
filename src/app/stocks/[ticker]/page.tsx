import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import TimeframePriceChart from "@/components/charts/TimeframePriceChart";
import { getStockDetail, stockNews } from "@/lib/mock/stocks";
import { formatPKR, formatNumber, formatCompactPKR } from "@/lib/format";

export default async function StockDetailPage({ params }: PageProps<"/stocks/[ticker]">) {
  const { ticker } = await params;
  const detail = getStockDetail(ticker);
  if (!detail) notFound();
  const { meta, holding } = detail;
  const price = holding?.price ?? (meta.week52High + meta.week52Low) / 2;

  const news = stockNews.filter((_, i) => i % 3 === ticker.length % 3).slice(0, 3);
  const newsList = news.length ? news : stockNews.slice(0, 2);

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/stocks" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Stocks
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{meta.sector}</p>
          <h1 className="font-heading text-3xl text-ink mt-1">
            {meta.ticker} <span className="text-lg font-body font-medium text-ink/60">{meta.name}</span>
          </h1>
          <p className="mt-2 font-heading text-2xl text-ink">{formatPKR(price, { decimals: 2 })}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <TimeframePriceChart currentPrice={price} seed={meta.ticker.length * 7} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Key Stats</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="P/E Ratio" value={meta.peRatio.toFixed(1)} />
              <Stat label="Market Cap" value={formatCompactPKR(meta.marketCap)} />
              <Stat label="Sector" value={meta.sector} />
              <Stat label="52W High / Low" value={`${meta.week52High} / ${meta.week52Low}`} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Recent News &amp; Announcements</h2>
            </CardHeader>
            <CardBody className="!pt-0">
              <div className="divide-y divide-border/70">
                {newsList.map((n) => (
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
                  <Stat label="Shares Held" value={formatNumber(holding.shares)} />
                  <Stat label="Avg Cost" value={formatPKR(holding.avgCost, { decimals: 2 })} />
                  <Stat label="Current Value" value={formatPKR(holding.shares * holding.price)} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Gain / Loss</p>
                    <GainLoss
                      value={holding.shares * holding.price - holding.shares * holding.avgCost}
                      percent={((holding.price - holding.avgCost) / holding.avgCost) * 100}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">You don&apos;t currently hold this stock. It&apos;s on your watchlist or discovered via research.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
