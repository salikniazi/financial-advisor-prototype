import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ReceiptText } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import InfoTooltip from "@/components/ui/InfoTooltip";
import Stat from "@/components/ui/Stat";
import TrendChart from "@/components/charts/TrendChart";
import { propertyById, fbrRateTable } from "@/lib/mock/property";
import { formatPKR, formatDate } from "@/lib/format";

export default async function PropertyDetailPage({ params }: PageProps<"/property/[id]">) {
  const { id } = await params;
  const property = propertyById(id);
  if (!property) notFound();

  const value = property.sizeSqFt * property.ratePerSqFt;
  const gain = value - property.purchasePrice;
  const gainPct = (gain / property.purchasePrice) * 100;
  const relatedRates = fbrRateTable.filter((r) => r.locality === property.locality);

  return (
    <div className="px-4 py-6 sm:px-8 pb-16">
      <Link href="/property" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <ChevronLeft size={16} /> Back to Property
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{property.locality}</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mt-1">{property.nickname}</h1>
          <div className="mt-2 flex items-center gap-1.5">
            <p className="font-heading text-2xl text-ink">{formatPKR(value)}</p>
            <InfoTooltip description="Calculated as size (sq ft) × FBR's published per-square-foot valuation rate for this locality and property type." source="Estimated using FBR's published per-square-foot valuation rates" />
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
              <p className="text-xs text-muted mt-0.5">Reflects periodic FBR valuation rate revisions for this locality.</p>
            </CardHeader>
            <CardBody>
              <TrendChart data={property.history} color="#0A0A0A" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg text-ink">Property Details</h2>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Locality" value={property.locality} />
              <Stat label="Property Type" value={property.type} />
              <Stat label="Size" value={`${property.sizeSqFt.toLocaleString()} sq ft`} />
              <Stat label="FBR Rate / sq ft" value={formatPKR(property.ratePerSqFt)} />
              <Stat label="Purchase Date" value={formatDate(property.purchaseDate)} />
              <Stat label="Purchase Price" value={formatPKR(property.purchasePrice)} />
            </CardBody>
          </Card>

          {relatedRates.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg text-ink">FBR Rate Table — {property.locality}</h2>
              </CardHeader>
              <CardBody className="!pt-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                      <th className="py-2 font-semibold">Property Type</th>
                      <th className="py-2 font-semibold text-right">Rate / sq ft</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedRates.map((r) => (
                      <tr key={r.type} className="border-b border-border/70 last:border-b-0">
                        <td className="py-2.5">{r.type}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{formatPKR(r.ratePerSqFt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          <Card className="bg-cream border-yellow-dark/30">
            <CardBody className="!pt-5">
              <div className="flex items-center gap-2 text-ink">
                <ReceiptText size={16} />
                <p className="text-sm font-semibold">Tax Relevance</p>
              </div>
              <p className="mt-1.5 text-sm text-ink/70 leading-relaxed">
                This valuation is used for your annual tax filing under the Wealth Statement&apos;s Property section.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
