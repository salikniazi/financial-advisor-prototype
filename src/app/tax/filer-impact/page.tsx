import { TrendingDown } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { filerImpactRows, totalFilerSavings } from "@/lib/mock/tax";
import { formatPKR } from "@/lib/format";

export default function FilerImpactPage() {
  return (
    <div className="pb-16 space-y-6">
      <Card className="bg-ink border-ink text-white">
        <CardBody className="!pt-6 flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-yellow">
            <TrendingDown size={18} />
            <span className="text-xs font-semibold uppercase tracking-wide">Becoming a Filer Would Save You</span>
          </div>
          <p className="font-heading text-4xl text-yellow">{formatPKR(totalFilerSavings)}</p>
          <p className="text-sm text-white/70 mt-1">Estimated for this tax year, based on your banking, property, and investment activity.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-heading text-lg text-ink">As a Filer vs. As a Non-Filer</h2>
          <p className="text-sm text-muted mt-0.5">Category-by-category cost comparison, quantified in Rupees.</p>
        </CardHeader>
        <CardBody className="!px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Category</th>
                  <th className="px-5 py-2.5 font-semibold text-right">As Filer</th>
                  <th className="px-5 py-2.5 font-semibold text-right">As Non-Filer</th>
                  <th className="px-5 py-2.5 font-semibold text-right">You Save</th>
                </tr>
              </thead>
              <tbody>
                {filerImpactRows.map((r) => (
                  <tr key={r.category} className="border-b border-border/70 last:border-b-0 align-top">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{r.category}</p>
                      <p className="text-xs text-muted mt-0.5">{r.note}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium text-green">{formatPKR(r.filerCost)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium text-red">{formatPKR(r.nonFilerCost)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-bold text-ink">{formatPKR(r.nonFilerCost - r.filerCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-cream">
                  <td className="px-5 py-3 font-heading text-ink">Total</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatPKR(filerImpactRows.reduce((s, r) => s + r.filerCost, 0))}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">
                    {formatPKR(filerImpactRows.reduce((s, r) => s + r.nonFilerCost, 0))}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-heading text-ink">{formatPKR(totalFilerSavings)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
