import PageHeader from "@/components/ui/PageHeader";
import RouteTabs from "@/components/ui/RouteTabs";

const tabs = [
  { href: "/bank", label: "Overview" },
  { href: "/bank/statements", label: "Statements" },
];

export default function BankTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader eyebrow="Assets" title="Bank" subtitle="Accounts, balances, and uploaded statements." />
      <RouteTabs tabs={tabs} />
      <div className="px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
