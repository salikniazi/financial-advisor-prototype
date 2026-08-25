import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import InfoTooltip from "@/components/ui/InfoTooltip";
import Stat from "@/components/ui/Stat";
import TrendChart from "@/components/charts/TrendChart";
import { vehicleById } from "@/lib/mock/vehicle";
import { formatPKR, formatDate } from "@/lib/format";

export default async function VehicleDetailPage({ params }: PageProps<"/vehicle/[id]">) {
  const { id } = await params;
  const vehicle = vehicleById(id);
  if (!vehicle) notFound();

  const gain = vehicle.currentValue - vehicle.purchasePrice;
  const gainPct = (gain / vehicle.purchasePrice) * 100;

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/vehicle" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Vehicle
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {vehicle.year} · {vehicle.variant}
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mt-1">
            {vehicle.make} {vehicle.model}
          </h1>
          <div className="mt-2 flex items-center gap-1.5">
            <p className="font-heading text-2xl text-ink">{formatPKR(vehicle.currentValue)}</p>
            <InfoTooltip
              description="Looked up from Pakwheels-style resale pricing data for this make, model, variant, and year."
              source="Estimated using Pakwheels' current resale valuations"
            />
          </div>
          <p className="mt-1 text-sm">
            Since purchase: <GainLoss value={gain} percent={gainPct} />
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="!pb-0">
              <h2 className="font-heading text-lg text-ink">Value Over Time</h2>
              <p className="text-xs text-muted mt-0.5">Vehicles typically depreciate — this reflects normal resale market trends.</p>
            </CardHeader>
            <CardBody>
              <TrendChart data={vehicle.history} color="#d9432e" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Vehicle Details</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Make" value={vehicle.make} />
              <Stat label="Model" value={vehicle.model} />
              <Stat label="Variant" value={vehicle.variant} />
              <Stat label="Year" value={String(vehicle.year)} />
              <Stat label="Purchase Date" value={formatDate(vehicle.purchaseDate)} />
              <Stat label="Purchase Price" value={formatPKR(vehicle.purchasePrice)} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
