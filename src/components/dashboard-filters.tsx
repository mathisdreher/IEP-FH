"use client";

import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface DashboardFiltersProps {
  regions: string[];
  currentRegion: string;
  currentSize: string;
}

const SIZE_OPTIONS = ["50 à 250", "251 à 999", "1000 et plus"];

export function DashboardFilters({ regions, currentRegion, currentSize }: DashboardFiltersProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const hasFilters = !!(currentRegion || currentSize);

  function updateFilters(region: string, size: string) {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (size) params.set("size", size);
    const qs = params.toString();
    router.push(`/tableau-de-bord${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <select
        value={currentRegion}
        onChange={(e) => updateFilters(e.target.value, currentSize)}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
      >
        <option value="">{t.home.allRegions}</option>
        {regions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select
        value={currentSize}
        onChange={(e) => updateFilters(currentRegion, e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
      >
        <option value="">{t.home.allSizes}</option>
        {SIZE_OPTIONS.map((s) => (
          <option key={s} value={s}>{s} {t.common.employees}</option>
        ))}
      </select>
      {hasFilters && (
        <button
          onClick={() => updateFilters("", "")}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          {t.common.reset}
        </button>
      )}
    </div>
  );
}
