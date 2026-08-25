import PageHeader from "@/components/ui/PageHeader";
import TrendChart from "@/components/charts/TrendChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { loans, loansTotal, loansHistory, creditCards, creditCardsTotal, creditCardsHistory, bnpl, bnplTotal, bnplHistory } from "@/lib/mock/bank";
import { formatPKR } from "@/lib/format";

function LiabilitySection({
  title,
  total,
  history,
  children,
}: {
  title: string;
  total: number;
  history: { month: string; value: number }[];
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex items-center justify-between !pb-0">
        <h2 className="font-heading text-lg text-ink">{title}</h2>
        <span className="font-heading text-lg text-red">{formatPKR(total)}</span>
      </CardHeader>
      <CardBody>
        <div className="mb-4">
          <TrendChart data={history} color="#d9432e" height={140} />
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

export default function LiabilitiesPage() {
  const total = loansTotal + creditCardsTotal + bnplTotal;
  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Liabilities"
        title={<span className="text-red">{formatPKR(total)}</span>}
        subtitle="Loans, credit cards, and BNPL plans pulled from your connected accounts."
      />

      <div className="mx-4 sm:mx-8">
        <LiabilitySection title="Loans" total={loansTotal} history={loansHistory}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">Lender</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold text-right">Monthly Payment</th>
                <th className="pb-2 font-semibold text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.type} className="border-t border-border">
                  <td className="py-2.5 font-medium">{l.lender}</td>
                  <td className="py-2.5 text-ink/70">{l.type}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatPKR(l.monthlyPayment)}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-red">{formatPKR(l.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LiabilitySection>

        <LiabilitySection title="Credit Cards" total={creditCardsTotal} history={creditCardsHistory}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">Bank</th>
                <th className="pb-2 font-semibold">Card</th>
                <th className="pb-2 font-semibold text-right">Limit</th>
                <th className="pb-2 font-semibold text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {creditCards.map((c) => (
                <tr key={c.card} className="border-t border-border">
                  <td className="py-2.5 font-medium">{c.bank}</td>
                  <td className="py-2.5 text-ink/70">{c.card}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatPKR(c.limit)}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-red">{formatPKR(c.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LiabilitySection>

        <LiabilitySection title="BNPL" total={bnplTotal} history={bnplHistory}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">Merchant</th>
                <th className="pb-2 font-semibold">Item</th>
                <th className="pb-2 font-semibold text-right">Installments Left</th>
                <th className="pb-2 font-semibold text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {bnpl.map((b) => (
                <tr key={b.item} className="border-t border-border">
                  <td className="py-2.5 font-medium">{b.merchant}</td>
                  <td className="py-2.5 text-ink/70">{b.item}</td>
                  <td className="py-2.5 text-right tabular-nums">{b.installmentsLeft}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-red">{formatPKR(b.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LiabilitySection>
      </div>
    </div>
  );
}
