"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  LineChart,
  Bitcoin,
  PieChart,
  Building2,
  Car,
  Coins,
  FolderPlus,
  Landmark,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Net Worth", icon: LayoutGrid },
  { href: "/stocks", label: "Stocks", icon: LineChart },
  { href: "/crypto", label: "Crypto", icon: Bitcoin },
  { href: "/mutual-funds", label: "Mutual Funds", icon: PieChart },
  { href: "/property", label: "Property", icon: Building2 },
  { href: "/vehicle", label: "Vehicle", icon: Car },
  { href: "/gold", label: "Gold", icon: Coins },
  { href: "/others", label: "Others", icon: FolderPlus },
  { href: "/tax", label: "Tax Filing", icon: Landmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6">
      <Link href="/" className="flex items-center gap-2 px-2 mb-8">
        <span className="text-2xl leading-none">🍋</span>
        <span className="font-heading text-2xl text-ink">Lime</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-ink text-yellow"
                  : "text-ink/70 hover:bg-cream hover:text-ink"
              )}
            >
              <Icon size={18} strokeWidth={2.25} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-cream px-3 py-3">
        <p className="text-xs text-muted leading-relaxed">
          All data shown is mocked for prototype purposes — no live bank, brokerage, or FBR
          connections.
        </p>
      </div>
    </aside>
  );
}
