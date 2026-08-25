"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import { properties } from "@/lib/mock/property";
import { formatPKR } from "@/lib/format";

export default function PropertyListPage() {
  const router = useRouter();
  const total = properties.reduce((s, p) => s + p.sizeSqFt * p.ratePerSqFt, 0);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Assets" title={formatPKR(total)} subtitle="Estimated using FBR's published per-square-foot valuation rates." />

      <div className="mx-4 sm:mx-8 grid gap-4 sm:grid-cols-2">
        {properties.map((p) => {
          const value = p.sizeSqFt * p.ratePerSqFt;
          const gain = value - p.purchasePrice;
          const gainPct = (gain / p.purchasePrice) * 100;
          return (
            <Card key={p.id} className="cursor-pointer hover:border-ink/20" onClick={() => router.push(`/property/${p.id}`)}>
              <CardBody className="!pt-5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={13} /> {p.locality}
                </div>
                <p className="mt-1.5 font-heading text-lg text-ink">{p.nickname}</p>
                <p className="text-xs text-ink/60">
                  {p.type} · {p.sizeSqFt.toLocaleString()} sq ft
                </p>
                <p className="mt-3 font-heading text-2xl text-ink">{formatPKR(value)}</p>
                <p className="mt-1 text-sm">
                  Gain since purchase: <GainLoss value={gain} percent={gainPct} />
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
