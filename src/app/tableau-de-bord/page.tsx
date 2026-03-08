import { getNationalStats, getRegionStats, getSectorStats, getFilteredDashboardStats } from "@/lib/data";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardFilters } from "@/components/dashboard-filters";
import { TrendingUp, TrendingDown, Building2, BarChart3, Award } from "lucide-react";
import type { NationalStats } from "@/lib/types";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble nationale de l'Index d'Égalité Professionnelle F/H.",
};

interface Props {
  searchParams: Promise<{ region?: string; size?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeRegion = typeof params.region === "string" ? params.region : "";
  const activeSize = typeof params.size === "string" ? params.size : "";
  const hasFilters = !!(activeRegion || activeSize);

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "fr") as Locale;
  const t = getDictionary(locale);

  // Region list for filter dropdown
  const regions = await getRegionStats();
  const regionNames = regions.map((r) => r.name).sort();

  // Dashboard data
  let national: NationalStats;
  let topSectors: { code: string; label: string; count: number; avgScore: number }[];
  let bottomSectors: { code: string; label: string; count: number; avgScore: number }[];

  if (hasFilters) {
    const data = await getFilteredDashboardStats({
      region: activeRegion || undefined,
      size: activeSize || undefined,
    });
    national = data.stats;
    topSectors = data.topSectors;
    bottomSectors = data.bottomSectors;
  } else {
    const [natStats, sectors] = await Promise.all([
      getNationalStats(),
      getSectorStats(),
    ]);
    national = natStats;
    const eligible = sectors.filter((s) => s.count >= 20);
    topSectors = [...eligible].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
    bottomSectors = [...eligible].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5);
  }

  // Year-over-year delta
  const years = Object.keys(national.avgByYear).map(Number).sort();
  const currentYear = years[years.length - 1];
  const prevYear = years.length > 1 ? years[years.length - 2] : null;
  const currentAvg = currentYear != null ? national.avgByYear[currentYear] : null;
  const prevAvg = prevYear != null ? national.avgByYear[prevYear] : null;
  const delta =
    prevAvg != null && currentAvg != null
      ? Math.round((currentAvg - prevAvg) * 10) / 10
      : null;

  // Dynamic subtitle
  const filterParts: string[] = [];
  if (activeRegion) filterParts.push(activeRegion);
  if (activeSize) filterParts.push(`${activeSize} ${t.common.employees}`);
  const subtitle = hasFilters ? filterParts.join(" · ") : t.dashboard.subtitle;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {subtitle} — {t.common.data} {national.year}
      </p>

      {/* Filters */}
      <DashboardFilters
        regions={regionNames}
        currentRegion={activeRegion}
        currentSize={activeSize}
      />

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-5 w-5" />}
          label={t.common.companies}
          value={national.totalCompanies.toLocaleString("fr-FR")}
        />
        <KpiCard
          icon={<BarChart3 className="h-5 w-5" />}
          label={t.dashboard.avgScore}
          value={`${national.avgScore}/100`}
          accent
          delta={delta}
        />
        <KpiCard
          icon={<Award className="h-5 w-5" />}
          label={t.dashboard.medianLabel}
          value={`${national.median}/100`}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={t.dashboard.withScore}
          value={national.totalWithScore.toLocaleString("fr-FR")}
        />
      </div>

      {/* Charts */}
      <DashboardCharts national={national} />

      {/* Top/bottom sectors */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3">🏆 {t.dashboard.topSectors}</h3>
          <div className="space-y-2">
            {topSectors.map((s, i) => (
              <div key={s.code} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {s.label}
                </span>
                <span className="font-bold text-emerald-600">{s.avgScore}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3">⚠️ {t.dashboard.bottomSectors}</h3>
          <div className="space-y-2">
            {bottomSectors.map((s, i) => (
              <div key={s.code} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {s.label}
                </span>
                <span className="font-bold text-red-600">{s.avgScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  delta?: number | null;
}) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </div>
  );
}
