"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { cn, scoreColor } from "@/lib/utils";
import type { SectorStats } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";
import {
  type SectorLevel,
  SECTOR_LEVELS,
  groupSectorsByLevel,
  getChildLevel,
} from "@/lib/naf-hierarchy";
import Link from "next/link";

interface SectorTableProps {
  sectors: SectorStats[];
  nationalAvg: number;
}

type SortKey = "label" | "count" | "avgScore" | "median";

const LEVEL_LABELS_KEY: Record<SectorLevel, "division" | "group" | "class" | "subclass"> = {
  division: "division",
  group: "group",
  class: "class",
  subclass: "subclass",
};

interface Breadcrumb {
  level: SectorLevel;
  prefix: string;
  label: string;
}

export function SectorTable({ sectors, nationalAvg }: SectorTableProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortAsc, setSortAsc] = useState(false);
  const [level, setLevel] = useState<SectorLevel>("subclass");
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  const currentPrefix = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].prefix : undefined;

  const grouped = useMemo(
    () => groupSectorsByLevel(sectors, level, currentPrefix),
    [sectors, level, currentPrefix],
  );

  const filtered = useMemo(() => {
    let items = grouped;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      );
    }
    items = [...items].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "string" && typeof vb === "string") {
        return sortAsc ? va.localeCompare(vb, "fr") : vb.localeCompare(va, "fr");
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return items;
  }, [grouped, search, sortKey, sortAsc]);

  const handleLevelChange = (newLevel: SectorLevel) => {
    setLevel(newLevel);
    setBreadcrumbs([]);
    setSearch("");
  };

  const handleDrillDown = (sector: SectorStats) => {
    const child = getChildLevel(level);
    if (!child) return;
    setBreadcrumbs((prev) => [...prev, { level, prefix: sector.code, label: sector.label }]);
    setLevel(child);
    setSearch("");
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index < 0) {
      // "All" clicked
      setBreadcrumbs([]);
      setLevel(breadcrumbs[0]?.level ?? "division");
      setSearch("");
    } else {
      const crumb = breadcrumbs[index];
      setBreadcrumbs((prev) => prev.slice(0, index));
      setLevel(crumb.level);
      setSearch("");
    }
  };

  const canDrillDown = level !== "subclass";

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "label");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div>
      {/* Level selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{t.secteurs.level} :</span>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {SECTOR_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => handleLevelChange(l)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                level === l && breadcrumbs.length === 0
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              {t.secteurs[LEVEL_LABELS_KEY[l]]}
            </button>
          ))}
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-primary hover:underline font-medium"
          >
            {t.secteurs.backToAll}
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className="text-primary hover:underline truncate max-w-[200px]"
              >
                {crumb.prefix} — {crumb.label}
              </button>
            </span>
          ))}
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {filtered.length} {t.secteurs.childrenOf} {breadcrumbs[breadcrumbs.length - 1].prefix}
          </span>
        </nav>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t.secteurs.filterPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left">
                <button onClick={() => toggleSort("label")} className="flex items-center gap-1 font-semibold">
                  {t.secteurs.sector} <SortIcon col="label" />
                </button>
              </th>
              <th className="px-4 py-2 text-right">
                <button onClick={() => toggleSort("count")} className="flex items-center gap-1 font-semibold ml-auto">
                  {t.common.companies} <SortIcon col="count" />
                </button>
              </th>
              <th className="px-4 py-2 text-right">
                <button onClick={() => toggleSort("avgScore")} className="flex items-center gap-1 font-semibold ml-auto">
                  {t.common.average} <SortIcon col="avgScore" />
                </button>
              </th>
              <th className="px-4 py-2 text-right">
                <button onClick={() => toggleSort("median")} className="flex items-center gap-1 font-semibold ml-auto">
                  {t.common.median} <SortIcon col="median" />
                </button>
              </th>
              <th className="px-4 py-2 text-right font-semibold">{t.secteurs.vsNational}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const diff = Math.round((s.avgScore - nationalAvg) * 10) / 10;
              return (
                <tr key={s.code} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      {canDrillDown ? (
                        <button
                          onClick={() => handleDrillDown(s)}
                          className="hover:text-primary hover:underline transition-colors text-left"
                        >
                          <span className="font-medium">{s.label}</span>
                        </button>
                      ) : (
                        <Link
                          href={`/?sector=${encodeURIComponent(s.code)}`}
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          <span className="font-medium">{s.label}</span>
                        </Link>
                      )}
                      {canDrillDown && (
                        <button
                          onClick={() => handleDrillDown(s)}
                          title={t.secteurs.drillDown}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{s.code}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {s.count.toLocaleString("fr-FR")}
                  </td>
                  <td className={cn("px-4 py-2 text-right font-bold", scoreColor(s.avgScore))}>
                    {s.avgScore}
                  </td>
                  <td className={cn("px-4 py-2 text-right", scoreColor(s.median))}>
                    {s.median}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground",
                      )}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {filtered.length} {t.secteurs.minCompanies}
      </p>
    </div>
  );
}
