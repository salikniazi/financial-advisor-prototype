import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import TrendChart from "@/components/charts/TrendChart";
import { bankAccounts, bankTotal, bankHistory } from "@/lib/mock/bank";
import { formatPKR } from "@/lib/format";

export default function BankOverviewPage() {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Balance</p>
        <p className="font-heading text-3xl text-ink mt-1">{formatPKR(bankTotal)}</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="!pb-0">
          <h2 className="font-heading text-lg text-ink">Balance Over Time</h2>
        </CardHeader>
        <CardBody>
          <TrendChart data={bankHistory} color="#0A0A0A" />
        </CardBody>
      </Card>

      <h2 className="mb-3 font-heading text-lg text-ink">Accounts</h2>
      {bankAccounts.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted">No bank accounts on file yet.</CardBody>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
