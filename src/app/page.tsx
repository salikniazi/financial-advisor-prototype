import PageHeader from "@/components/ui/PageHeader";
import NetWorthTable from "@/components/networth/NetWorthTable";
import TrendChart from "@/components/charts/TrendChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { assetRows, liabilityRows, netWorthByMonth, currentNetWorth } from "@/lib/mock/netWorth";
import { lastMonths } from "@/lib/mock/months";
import { formatPKR } from "@/lib/format";
import Badge from "@/components/ui/Badge";

export default function NetWorthPage() {
  const months = lastMonths(12);
  const series = netWorthByMonth();
  // series is most-recent-first (matches `months`), so index 0 is the current month
  const latest = series[0].value;
  const prev = series[1]?.value ?? latest;
  const delta = latest - prev;
  const positive = delta >= 0;

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Your Full Financial Picture"
        title={
          <span>
            {formatPKR(currentNetWorth)}
            <span className="ml-3 align-middle">
              <Badge tone={positive ? "green" : "red"}>
                {positive ? "+" : ""}
                {formatPKR(delta, { compact: true })} this month
              </Badge>
            </span>
          </span>
        }
        subtitle="Total assets minus total liabilities, across every account Lime tracks for you."
      />

      <div className="mx-4 sm:mx-8 mb-6">
        <Card>
          <CardHeader className="flex items-center justify-between !pb-0">
            <h2 className="font-heading text-lg text-ink">Net Worth Trend</h2>
            <span className="text-xs text-muted">Last 12 months</span>
          </CardHeader>
          <CardBody>
            <TrendChart data={series} color="#0A0A0A" />
          </CardBody>
        </Card>
      </div>

      <div className="mb-3 px-4 sm:px-8">
        <h2 className="font-heading text-lg text-ink">Breakdown by Category</h2>
        <p className="text-sm text-muted mt-0.5">
          Scroll horizontally for history, or click any row to see the details. Rows stay aligned as you scroll.
        </p>
      </div>

      <NetWorthTable months={months} assetRows={assetRows} liabilityRows={liabilityRows} netWorthSeries={series} />
    </div>
  );
}
