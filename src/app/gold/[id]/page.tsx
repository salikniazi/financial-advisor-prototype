import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import InfoTooltip from "@/components/ui/InfoTooltip";
import Stat from "@/components/ui/Stat";
import TrendChart from "@/components/charts/TrendChart";
import { goldById, goldRates, GOLD_SOURCE } from "@/lib/mock/gold";
import { formatPKR, formatDate } from "@/lib/format";

export default async function GoldDetailPage({ params }: PageProps<"/gold/[id]">) {
  const { id } = await params;
  const item = goldById(id);
  if (!item) notFound();

  const value = item.weightGrams * goldRates[item.purity];
  const gain = value - item.purchasePrice;
  const gainPct = (gain / item.purchasePrice) * 100;

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/gold" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Gold
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{item.purity} Purity</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mt-1">{item.type}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <p className="font-heading text-2xl text-ink">{formatPKR(value)}</p>
            <InfoTooltip description={`Calculated as weight × current ${item.purity} gold rate.`} source={`Estimated using ${GOLD_SOURCE}`} />
          </div>
          <p className="mt-1 text-sm">
            Gain since purchase: <GainLoss value={gain} percent={gainPct} />
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="!pb-0">
              <h2 className="font-heading text-lg text-ink">Value Over Time</h2>
              <p className="text-xs text-muted mt-0.5">Gold prices generally trend up, with spikes during PKR devaluation.</p>
            </CardHeader>
            <CardBody>
              <TrendChart data={item.history} color="#0A0A0A" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Item Details</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Type" value={item.type} />
              <Stat label="Weight" value={`${item.weightGrams}g (${(item.weightGrams / 11.6638).toFixed(2)} tola)`} />
              <Stat label="Purity" value={item.purity} />
              <Stat label="Current Rate" value={`${formatPKR(goldRates[item.purity])} / g`} />
              <Stat label="Purchase Date" value={formatDate(item.purchaseDate)} />
              <Stat label="Purchase Price" value={formatPKR(item.purchasePrice)} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
