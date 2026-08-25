import RouteTabs from "@/components/ui/RouteTabs";

const tabs = [
  { href: "/stocks", label: "Portfolio" },
  { href: "/stocks/watchlist", label: "Watchlist" },
  { href: "/stocks/market", label: "Market" },
  { href: "/stocks/research", label: "Research" },
  { href: "/stocks/statement", label: "Account Statement" },
];

export default function StocksTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 pt-6 sm:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Investments</p>
        <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-4">Stocks</h1>
      </div>
      <RouteTabs tabs={tabs} />
      <div className="px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
