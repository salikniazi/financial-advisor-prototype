"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type RouteTab = { href: string; label: string };

export default function RouteTabs({ tabs }: { tabs: RouteTab[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-border px-4 sm:px-8">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "relative whitespace-nowrap px-3.5 py-3 text-sm font-semibold transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {tab.label}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-yellow-dark" />}
          </Link>
        );
      })}
    </div>
  );
}
