"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, Plus, Building2, BarChart3, ExternalLink } from "lucide-react";
import { ScoreGauge } from "@/components/score-gauge";
import { cn, scoreColor } from "@/lib/utils";
import type { Company, YearRecord, SectorStats } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";
import { useChartColors } from "@/lib/chart-colors";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

type CompareMode = "companies" | "sectors";

interface CompanyWithHistory {
  company: Company;
  history: YearRecord[];
}

const SUB_SCORE_KEYS_SMALL = [
  { key: "scoreRemunerations" as const, label: "Rémunération", max: 40 },
  { key: "scoreAugmentations" as const, label: "Augmentations", max: 35 },
  { key: "scoreCongesMaternite" as const, label: "Congé maternité", max: 15 },
  { key: "scoreHautesRemunerations" as const, label: "Hautes rém.", max: 10 },
];

const SUB_SCORE_KEYS_LARGE = [
  { key: "scoreRemunerations" as const, label: "Rémunération", max: 40 },
  { key: "scoreAugmentationsHP" as const, label: "Augmentations HP", max: 20 },
  { key: "scorePromotions" as const, label: "Promotions", max: 15 },
  { key: "scoreCongesMaternite" as const, label: "Congé maternité", max: 15 },
  { key: "scoreHautesRemunerations" as const, label: "Hautes rém.", max: 10 },
];

function getSubScoreKeys(items: CompanyWithHistory[]) {
  const hasSmall = items.some((i) => i.company.size === "50 à 250");
  const hasLarge = items.some((i) => i.company.size !== "50 à 250");
  if (hasSmall && !hasLarge) return SUB_SCORE_KEYS_SMALL;
  if (hasLarge && !hasSmall) return SUB_SCORE_KEYS_LARGE;
  // Mixed: show all indicators
  return [
    { key: "scoreRemunerations" as const, label: "Rémunération", max: 40 },
    { key: "scoreAugmentations" as const, label: "Augmentations", max: 35 },
    { key: "scoreAugmentationsHP" as const, label: "Augmentations HP", max: 20 },
    { key: "scorePromotions" as const, label: "Promotions", max: 15 },
    { key: "scoreCongesMaternite" as const, label: "Congé maternité", max: 15 },
    { key: "scoreHautesRemunerations" as const, label: "Hautes rém.", max: 10 },
  ];
}

export default function ComparerPage() {
  return (
    <Suspense>
      <ComparerContent />
    </Suspense>
  );
}

function ComparerContent() {
  const { t } = useLanguage();
  const chartColors = useChartColors();
  const [mode, setMode] = useState<CompareMode>("companies");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.comparer.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.comparer.subtitle}</p>

      {/* Mode toggle */}
      <div className="mt-4 flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => setMode("companies")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === "companies" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
          )}
        >
          <Building2 className="h-4 w-4" />
          {t.comparer.companiesMode}
        </button>
        <button
          onClick={() => setMode("sectors")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === "sectors" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
          )}
        >
          <BarChart3 className="h-4 w-4" />
          {t.comparer.sectorsMode}
        </button>
      </div>

      {mode === "companies" ? (
        <CompanyCompare t={t} chartColors={chartColors} />
      ) : (
        <SectorCompare t={t} chartColors={chartColors} />
      )}
    </div>
  );
}

/* ========== Company Compare ========== */

function CompanyCompare({ t, chartColors }: { t: ReturnType<typeof import("@/components/language-provider").useLanguage>["t"]; chartColors: ReturnType<typeof useChartColors> }) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<CompanyWithHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searching, setSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Pre-load company from URL ?siren=...
  useEffect(() => {
    if (initialLoaded) return;
    const siren = searchParams.get("siren");
    if (!siren) { setInitialLoaded(true); return; }
    (async () => {
      try {
        const [searchRes, historyRes] = await Promise.all([
          fetch(`/api/search?q=${siren}&limit=1`),
          fetch(`/api/company/${siren}/history`),
        ]);
        const searchData = await searchRes.json();
        const history: YearRecord[] = await historyRes.json();
        const company = searchData.results?.[0];
        if (company && history.length > 0) {
          setSelected([{ company, history }]);
        }
      } catch {}
      setInitialLoaded(true);
    })();
  }, [searchParams, initialLoaded]);

  const searchCompanies = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setSearchResults(data.results.filter((c: Company) => !selected.some((s) => s.company.siren === c.siren)));
    } finally { setSearching(false); }
  }, [selected]);

  const addCompany = useCallback(async (company: Company) => {
    const res = await fetch(`/api/company/${company.siren}/history`);
    const history: YearRecord[] = await res.json();
    setSelected((prev) => [...prev, { company, history }]);
    setSearchQuery(""); setSearchResults([]);
  }, []);

  const removeCompany = (siren: string) => setSelected((prev) => prev.filter((s) => s.company.siren !== siren));

  const subScoreKeys = useMemo(() => getSubScoreKeys(selected), [selected]);
  const radarData = selected.length > 0 ? buildRadarData(selected, subScoreKeys) : [];
  const barData = selected.map((s, i) => ({
    name: s.company.name.length > 20 ? s.company.name.substring(0, 20) + "…" : s.company.name,
    score: s.company.latestScore, fill: COLORS[i % COLORS.length],
  }));

  // Sub-score breakdown bar data
  const subScoreBarData = subScoreKeys.map(({ key, label, max }) => {
    const point: Record<string, string | number | null> = { indicator: label };
    for (const item of selected) {
      const latest = item.history.find((h) => h.year === item.company.latestYear);
      point[item.company.siren] = latest?.[key] ?? null;
    }
    return point;
  });

  return (
    <>
      {selected.length < 5 && (
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder={t.comparer.addPlaceholder} value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); searchCompanies(e.target.value); }}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((c) => (
                <button key={c.siren} onClick={() => addCompany(c)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={cn("font-bold", scoreColor(c.latestScore))}>{c.latestScore ?? t.common.NC}</span>
                </button>
              ))}
            </div>
          )}
          {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selected.map((s, i) => (
            <div key={s.company.siren} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm" style={{ borderColor: COLORS[i % COLORS.length] }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <Link href={`/entreprise/${s.company.siren}`} className="truncate max-w-[150px] hover:underline">{s.company.name}</Link>
              <button onClick={() => removeCompany(s.company.siren)}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
            </div>
          ))}
        </div>
      )}

      {selected.length >= 2 && (
        <>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Overall score bar chart */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-4">{t.comparer.overallScore}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: chartColors.text }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartColors.text }} width={120} />
                    <Tooltip formatter={(v) => [`${v}/100`, t.common.score]} contentStyle={chartColors.tooltip} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-4">{t.comparer.detailedIndicators}</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={chartColors.grid} />
                      <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10, fill: chartColors.text }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: chartColors.text }} />
                      {selected.map((s, i) => (
                        <Radar key={s.company.siren} name={s.company.name} dataKey={s.company.siren} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2} />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Sub-score breakdown grouped bar chart */}
          <div className="mt-8 rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-4">{t.comparer.scoreBreakdown}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subScoreBarData} margin={{ left: 10, right: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="indicator" tick={{ fontSize: 11, fill: chartColors.text }} />
                  <YAxis tick={{ fontSize: 12, fill: chartColors.text }} />
                  <Tooltip contentStyle={chartColors.tooltip} />
                  {selected.map((s, i) => (
                    <Bar key={s.company.siren} dataKey={s.company.siren} name={s.company.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison table with sub-scores */}
          <div className="mt-8 rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-4">{t.comparer.companyTable}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t.comparer.companiesMode}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.common.score}</th>
                    {subScoreKeys.map(({ label }) => (
                      <th key={label} className="px-3 py-2 text-right font-semibold text-xs">{label}</th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s, i) => {
                    const latest = s.history.find((h) => h.year === s.company.latestYear);
                    return (
                      <tr key={s.company.siren} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="font-medium truncate max-w-[180px]">{s.company.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-[18px]">{s.company.sector}</span>
                        </td>
                        <td className={cn("px-3 py-2 text-right font-bold", scoreColor(s.company.latestScore))}>
                          {s.company.latestScore ?? t.common.NC}
                        </td>
                        {subScoreKeys.map(({ key, max }) => {
                          const val = latest?.[key];
                          return (
                            <td key={key} className="px-3 py-2 text-right text-muted-foreground">
                              {val != null ? <span>{val}<span className="text-xs">/{max}</span></span> : t.common.NC}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right">
                          <Link href={`/entreprise/${s.company.siren}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            {t.comparer.viewProfile}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selected.length >= 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-8">
          {selected.map((s, i) => (
            <Link key={s.company.siren} href={`/entreprise/${s.company.siren}`} className="text-center group">
              <ScoreGauge score={s.company.latestScore} size="md" />
              <p className="mt-2 text-sm font-medium max-w-[120px] truncate group-hover:underline" style={{ color: COLORS[i % COLORS.length] }}>{s.company.name}</p>
            </Link>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <Search className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p>{t.comparer.emptyState}</p>
        </div>
      )}
    </>
  );
}

/* ========== Sector Compare ========== */

function SectorCompare({ t, chartColors }: { t: ReturnType<typeof import("@/components/language-provider").useLanguage>["t"]; chartColors: ReturnType<typeof useChartColors> }) {
  const [allSectors, setAllSectors] = useState<SectorStats[]>([]);
  const [selected, setSelected] = useState<SectorStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/sectors").then((r) => r.json()).then(setAllSectors).catch(() => {});
  }, []);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 1 || allSectors.length === 0) return [];
    const q = searchQuery.toLowerCase();
    return allSectors
      .filter((s) => !selected.some((sel) => sel.code === s.code))
      .filter((s) => s.label.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchQuery, allSectors, selected]);

  const addSector = (sector: SectorStats) => {
    setSelected((prev) => [...prev, sector]);
    setSearchQuery("");
  };

  const removeSector = (code: string) => setSelected((prev) => prev.filter((s) => s.code !== code));

  const barData = selected.map((s, i) => ({
    name: s.label.length > 25 ? s.label.substring(0, 25) + "…" : s.label,
    avgScore: s.avgScore,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <>
      {selected.length < 5 && (
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder={t.comparer.addSectorPlaceholder} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((s) => (
                <button key={s.code} onClick={() => addSector(s)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.code}</span>
                  <span className={cn("font-bold", scoreColor(s.avgScore))}>{s.avgScore}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selected.map((s, i) => (
            <div key={s.code} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm" style={{ borderColor: COLORS[i % COLORS.length] }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[150px]">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.code}</span>
              <button onClick={() => removeSector(s.code)}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
            </div>
          ))}
        </div>
      )}

      {selected.length >= 2 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Bar chart: average scores */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-4">{t.comparer.sectorAvgScore}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: chartColors.text }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: chartColors.text }} width={140} />
                  <Tooltip formatter={(v) => [`${v}/100`, t.comparer.sectorAvgScore]} contentStyle={chartColors.tooltip} />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison table with min/max */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-4">{t.comparer.companyTable}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">{t.secteurs.sector}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.comparer.sectorCount}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.common.average}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.comparer.sectorMedian}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.comparer.sectorMin}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t.comparer.sectorMax}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s, i) => (
                    <tr key={s.code} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-[150px] font-medium">{s.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-[18px]">{s.code}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{s.count.toLocaleString("fr-FR")}</td>
                      <td className={cn("px-3 py-2 text-right font-bold", scoreColor(s.avgScore))}>{s.avgScore}</td>
                      <td className={cn("px-3 py-2 text-right", scoreColor(s.median))}>{s.median}</td>
                      <td className={cn("px-3 py-2 text-right", scoreColor(s.min))}>{s.min}</td>
                      <td className={cn("px-3 py-2 text-right", scoreColor(s.max))}>{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selected.length >= 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-8">
          {selected.map((s, i) => (
            <div key={s.code} className="text-center">
              <ScoreGauge score={s.avgScore} size="md" />
              <p className="mt-2 text-sm font-medium max-w-[120px] truncate" style={{ color: COLORS[i % COLORS.length] }}>{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.code}</p>
            </div>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p>{t.comparer.emptyState}</p>
        </div>
      )}
    </>
  );
}

/* ========== Helpers ========== */

function buildRadarData(items: CompanyWithHistory[], subScoreKeys: ReturnType<typeof getSubScoreKeys>) {
  return subScoreKeys.map(({ key, label, max }) => {
    const point: Record<string, string | number | null> = { indicator: label };
    for (const item of items) {
      const latest = item.history.find((h) => h.year === item.company.latestYear);
      const val = latest?.[key];
      point[item.company.siren] = val != null ? Math.round((val / max) * 100) : 0;
    }
    return point;
  });
}
