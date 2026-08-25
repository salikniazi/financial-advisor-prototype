"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";

const navItems = [
  { href: "/", label: "Net Worth" },
  { href: "/stocks", label: "Stocks" },
  { href: "/crypto", label: "Crypto" },
  { href: "/mutual-funds", label: "Mutual Funds" },
  { href: "/property", label: "Property" },
  { href: "/vehicle", label: "Vehicle" },
  { href: "/gold", label: "Gold" },
  { href: "/others", label: "Others" },
  { href: "/tax", label: "Tax Filing" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-xl leading-none">🍋</span>
        <span className="font-heading text-xl text-ink">Lime</span>
        {user && (
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="ml-auto flex items-center gap-1 rounded-full bg-cream px-2.5 py-1.5 text-xs font-semibold text-ink/70"
          >
            <LogOut size={13} /> Sign out
          </button>
        )}
      </div>
      <nav className="flex gap-1 overflow-x-auto no-scrollbar px-3 pb-3">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold",
                active ? "bg-ink text-yellow" : "bg-cream text-ink/70"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
