import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge, { GainLoss } from "@/components/ui/Badge";
import TrendChart from "@/components/charts/TrendChart";
import { fundById, mutualFundHoldings } from "@/lib/mock/mutualFunds";
import { formatPKR, formatNumber } from "@/lib/format";

const riskTone = { Low: "green", Moderate: "yellow", High: "red" } as const;

export default async function FundDetailPage({ params }: PageProps<"/mutual-funds/[fundId]">) {
  const { fundId } = await params;
  const fund = fundById(fundId);
  if (!fund) notFound();
  const holding = mutualFundHoldings.find((h) => h.fundId === fund.id) ?? null;

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/mutual-funds" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Mutual Funds
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{fund.category}</Badge>
            <Badge tone={riskTone[fund.riskRating]}>{fund.riskRating} Risk</Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mt-2">{fund.name}</h1>
          <p className="text-sm text-muted mt-0.5">{fund.amc}</p>
          <p className="mt-2 font-heading text-2xl text-ink">{formatPKR(fund.nav, { decimals: 2 })} <span className="text-sm font-body font-medium text-ink/50">NAV</span></p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="!pb-0">
              <h2 className="font-heading text-lg text-ink">NAV Over Time</h2>
            </CardHeader>
            <CardBody>
              <TrendChart data={fund.history} color="#0A0A0A" valueStyle="precise" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Fund Details</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Fund Manager" value={fund.manager} />
              <Stat label="Expense Ratio" value={`${fund.expenseRatio.toFixed(2)}%`} />
              <Stat label="1M Return" value={`${fund.return1M >= 0 ? "+" : ""}${fund.return1M.toFixed(2)}%`} />
              <Stat label="1Y Return" value={`${fund.return1Y >= 0 ? "+" : ""}${fund.return1Y.toFixed(2)}%`} />
              <Stat label="Category Benchmark (1Y)" value={`${fund.benchmarkReturn1Y >= 0 ? "+" : ""}${fund.benchmarkReturn1Y.toFixed(2)}%`} />
              <Stat
                label="vs. Benchmark"
                value={`${fund.return1Y - fund.benchmarkReturn1Y >= 0 ? "+" : ""}${(fund.return1Y - fund.benchmarkReturn1Y).toFixed(2)} pts`}
              />
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
                  <Stat label="Units Held" value={formatNumber(holding.units)} />
                  <Stat label="Avg Cost" value={formatPKR(holding.avgCost, { decimals: 2 })} />
                  <Stat label="Current Value" value={formatPKR(holding.units * fund.nav)} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Gain / Loss</p>
                    <GainLoss
                      value={holding.units * fund.nav - holding.units * holding.avgCost}
                      percent={((fund.nav - holding.avgCost) / holding.avgCost) * 100}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">You don&apos;t currently hold units in this fund.</p>
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
