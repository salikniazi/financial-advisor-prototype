"use client";

import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { GainLoss } from "@/components/ui/Badge";
import { goldItems, goldRates } from "@/lib/mock/gold";
import { formatPKR } from "@/lib/format";

export default function GoldListPage() {
  const router = useRouter();
  const total = goldItems.reduce((s, g) => s + g.weightGrams * goldRates[g.purity], 0);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Assets" title={formatPKR(total)} subtitle="Estimated using Sarafa Bazaar Karachi gold rates." />

      <div className="mx-4 sm:mx-8 grid gap-4 sm:grid-cols-2">
        {goldItems.map((g) => {
          const value = g.weightGrams * goldRates[g.purity];
          const gain = value - g.purchasePrice;
          const gainPct = (gain / g.purchasePrice) * 100;
          return (
            <Card key={g.id} className="cursor-pointer hover:border-ink/20" onClick={() => router.push(`/gold/${g.id}`)}>
              <CardBody className="!pt-5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Coins size={13} /> {g.purity}
                </div>
                <p className="mt-1.5 font-heading text-lg text-ink">{g.type}</p>
                <p className="text-xs text-ink/60">{g.weightGrams}g</p>
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
