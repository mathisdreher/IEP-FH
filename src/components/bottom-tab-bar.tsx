"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, LayoutDashboard, GitCompareArrows, BarChart3, Map } from "lucide-react";
import { useLanguage } from "./language-provider";

export function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/", label: t.nav.search, icon: Search },
    { href: "/tableau-de-bord", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/comparer", label: t.nav.compare, icon: GitCompareArrows },
    { href: "/secteurs", label: t.nav.sectors, icon: BarChart3 },
    { href: "/regions", label: t.nav.regions, icon: Map },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
