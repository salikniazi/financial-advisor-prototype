import PageHeader from "@/components/ui/PageHeader";
import RouteTabs from "@/components/ui/RouteTabs";

const tabs = [
  { href: "/mutual-funds", label: "My Holdings" },
  { href: "/mutual-funds/explore", label: "Explore Funds" },
];

export default function MutualFundsTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader eyebrow="Investments" title="Mutual Funds" subtitle="Units held across AMC-managed funds, and what else is out there." />
      <RouteTabs tabs={tabs} />
      <div className="px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
