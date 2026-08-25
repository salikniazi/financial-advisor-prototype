import RouteTabs from "@/components/ui/RouteTabs";

const tabs = [
  { href: "/crypto", label: "Portfolio" },
  { href: "/crypto/watchlist", label: "Watchlist" },
  { href: "/crypto/market", label: "Market" },
  { href: "/crypto/research", label: "Research" },
  { href: "/crypto/statement", label: "Account Statement" },
];

export default function CryptoTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 pt-6 sm:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Investments</p>
        <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-4">Crypto</h1>
      </div>
      <RouteTabs tabs={tabs} />
      <div className="px-4 py-6 sm:px-8">{children}</div>
    </div>
  );
}
