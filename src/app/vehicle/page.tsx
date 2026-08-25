"use client";

import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import { vehicles } from "@/lib/mock/vehicle";
import { formatPKR } from "@/lib/format";

export default function VehicleListPage() {
  const router = useRouter();
  const total = vehicles.reduce((s, v) => s + v.currentValue, 0);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Assets" title={formatPKR(total)} subtitle="Estimated using Pakwheels' current resale valuations." />

      <div className="mx-4 sm:mx-8 grid gap-4 sm:grid-cols-2">
        {vehicles.map((v) => {
          const gain = v.currentValue - v.purchasePrice;
          const gainPct = (gain / v.purchasePrice) * 100;
          return (
            <Card key={v.id} className="cursor-pointer hover:border-ink/20" onClick={() => router.push(`/vehicle/${v.id}`)}>
              <CardBody className="!pt-5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Car size={13} /> {v.year}
                </div>
                <p className="mt-1.5 font-heading text-lg text-ink">
                  {v.make} {v.model}
                </p>
                <p className="text-xs text-ink/60">{v.variant}</p>
                <p className="mt-3 font-heading text-2xl text-ink">{formatPKR(v.currentValue)}</p>
                <p className="mt-1 text-sm">
                  Since purchase: <GainLoss value={gain} percent={gainPct} />
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
