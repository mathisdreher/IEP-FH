"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Building2, GitCompareArrows, Map, Search, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";

export function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const links = [
    { href: "/", label: t.nav.search, icon: Search },
    { href: "/tableau-de-bord", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/comparer", label: t.nav.compare, icon: GitCompareArrows },
    { href: "/secteurs", label: t.nav.sectors, icon: BarChart3 },
    { href: "/regions", label: t.nav.regions, icon: Map },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t.nav.brand}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "hidden md:flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          <div className="ml-2 flex items-center gap-0.5 border-l border-border pl-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
