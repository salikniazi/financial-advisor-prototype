"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import AIOverlay from "@/components/ai/AIOverlay";

// /login is the app's front door for a signed-out visitor — it gets no
// sidebar, no mobile nav, no floating assistant, just its own full-screen layout.
const CHROMELESS_PATHS = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <AIOverlay />
    </div>
  );
}
