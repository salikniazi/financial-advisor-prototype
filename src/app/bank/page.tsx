import PageHeader from "@/components/ui/PageHeader";
import TrendChart from "@/components/charts/TrendChart";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { bankAccounts, bankTotal, bankHistory } from "@/lib/mock/bank";
import { formatPKR } from "@/lib/format";

export default function BankPage() {
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Bank Accounts" title={formatPKR(bankTotal)} subtitle="Pulled from your connected bank account statements." />

      <div className="mx-4 sm:mx-8 mb-6">
        <Card>
          <CardHeader className="!pb-0">
            <h2 className="font-heading text-lg text-ink">Balance Over Time</h2>
          </CardHeader>
          <CardBody>
            <TrendChart data={bankHistory} color="#0A0A0A" />
          </CardBody>
        </Card>
      </div>

      <div className="mx-4 sm:mx-8">
        <h2 className="mb-3 font-heading text-lg text-ink">Accounts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((a) => (
            <Card key={a.bank + a.type}>
              <CardBody className="!pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{a.bank}</p>
                <p className="mt-1 text-sm text-ink/70">{a.type}</p>
                <p className="mt-3 font-heading text-xl text-ink">{formatPKR(a.balance)}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
