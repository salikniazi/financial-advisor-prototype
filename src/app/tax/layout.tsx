import RouteTabs from "@/components/ui/RouteTabs";
import TaxHeader from "@/components/tax/TaxHeader";
import { TaxStatusProvider } from "@/components/tax/TaxStatusProvider";

const tabs = [
  { href: "/tax", label: "File Return" },
  { href: "/tax/filer-impact", label: "Filer Impact" },
  { href: "/tax/filing-history", label: "Filing History" },
];

export default function TaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <TaxStatusProvider>
      <div>
        <div className="px-4 pt-6 sm:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Tax</p>
          <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-4">Tax Filing</h1>
          <TaxHeader />
        </div>
        <RouteTabs tabs={tabs} />
        <div className="px-4 py-6 sm:px-8">{children}</div>
      </div>
    </TaxStatusProvider>
  );
}
