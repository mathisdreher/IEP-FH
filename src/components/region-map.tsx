"use client";

import { useState } from "react";
import { cn, scoreColor } from "@/lib/utils";
import type { RegionStats } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";
import { useChartColors } from "@/lib/chart-colors";
import { REGION_PATHS } from "@/lib/france-regions";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface RegionMapProps {
  regions: RegionStats[];
  nationalAvg: number;
}

function getBarColor(score: number): string {
  if (score >= 90) return "#059669";
  if (score >= 85) return "#16a34a";
  if (score >= 80) return "#d97706";
  return "#dc2626";
}

function getMapFill(score: number): string {
  if (score >= 90) return "#059669";
  if (score >= 87) return "#16a34a";
  if (score >= 85) return "#65a30d";
  if (score >= 83) return "#ca8a04";
  if (score >= 80) return "#d97706";
  return "#dc2626";
}

const DROM_REGIONS = ["Guadeloupe", "Martinique", "Guyane", "La Réunion", "Mayotte"];

export function RegionMap({ regions, nationalAvg }: RegionMapProps) {
  const { t } = useLanguage();
  const chartColors = useChartColors();
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const sorted = [...regions].sort((a, b) => b.avgScore - a.avgScore);
  const regionMap = new Map(regions.map((r) => [r.name, r]));

  const chartData = sorted.map((r) => ({
    name: r.name,
    avgScore: r.avgScore,
    count: r.count,
  }));

  const hoveredRegion = hovered ? regionMap.get(hovered) : null;

  return (
    <div className="mt-6 space-y-8">
      {/* Interactive Map */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-4">{t.regions.mapTitle}</h3>
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* SVG Map */}
          <div className="relative">
            <svg
              viewBox="0 0 560 560"
              className="w-full max-w-[500px] mx-auto h-auto"
              role="img"
              aria-label="Carte de France"
            >
              {Object.entries(REGION_PATHS).map(([name, { d, cx, cy }]) => {
                const stats = regionMap.get(name);
                const score = stats?.avgScore ?? 0;
                const isHovered = hovered === name;
                return (
                  <Link key={name} href={`/tableau-de-bord?region=${encodeURIComponent(name)}`}>
                    <g
                      onMouseEnter={(e) => {
                        setHovered(name);
                        const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                        setTooltipPos({
                          x: (cx / 560) * rect.width,
                          y: (cy / 560) * rect.height,
                        });
                      }}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                    >
                      <path
                        d={d}
                        fill={getMapFill(score)}
                        fillOpacity={isHovered ? 1 : 0.75}
                        stroke="var(--background)"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all duration-150"
                      />
                      {stats && (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="pointer-events-none"
                          fill="white"
                          fontSize="11"
                          fontWeight="bold"
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                        >
                          {stats.avgScore}
                        </text>
                      )}
                    </g>
                  </Link>
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredRegion && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg -translate-x-1/2 -translate-y-full"
                style={{ left: tooltipPos.x, top: tooltipPos.y - 8 }}
              >
                <p className="font-semibold">{hoveredRegion.name}</p>
                <p className={cn("text-lg font-bold", scoreColor(hoveredRegion.avgScore))}>
                  {hoveredRegion.avgScore}/100
                </p>
                <p className="text-xs text-muted-foreground">
                  {hoveredRegion.count.toLocaleString("fr-FR")} {t.regions.companies}
                </p>
              </div>
            )}
          </div>

          {/* Side panel: DROM + Legend */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">{t.common.score}</p>
              <div className="flex items-center gap-1">
                {[
                  { color: "#dc2626", label: "<80" },
                  { color: "#d97706", label: "80" },
                  { color: "#ca8a04", label: "83" },
                  { color: "#65a30d", label: "85" },
                  { color: "#16a34a", label: "87" },
                  { color: "#059669", label: "90+" },
                ].map((l) => (
                  <div key={l.label} className="flex-1 text-center">
                    <div className="h-3 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.75 }} />
                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overseas territories */}
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">{t.regions.overseas}</p>
              <div className="grid grid-cols-2 gap-2">
                {DROM_REGIONS.map((name) => {
                  const stats = regionMap.get(name);
                  if (!stats) return null;
                  const isHov = hovered === name;
                  return (
                    <Link
                      key={name}
                      href={`/tableau-de-bord?region=${encodeURIComponent(name)}`}
                      className={cn(
                        "rounded-lg border p-2 text-center transition-all hover:shadow-md",
                        isHov ? "ring-2 ring-primary" : "border-border"
                      )}
                      onMouseEnter={() => setHovered(name)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className="mx-auto mb-1 h-2.5 w-full rounded-sm"
                        style={{ backgroundColor: getMapFill(stats.avgScore), opacity: 0.75 }}
                      />
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className={cn("text-sm font-bold", scoreColor(stats.avgScore))}>{stats.avgScore}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-4">{t.regions.avgByRegion}</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" domain={[70, 100]} tick={{ fontSize: 12, fill: chartColors.text }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: chartColors.text }}
                width={180}
              />
              <Tooltip
                formatter={(v, name) => {
                  if (name === "avgScore") return [`${v}/100`, t.common.average];
                  return [`${v}`, String(name)];
                }}
                contentStyle={chartColors.tooltip}
              />
              <ReferenceLine
                x={nationalAvg}
                stroke="#2563eb"
                strokeDasharray="5 5"
                label={{ value: `Nat. ${nationalAvg}`, position: "top", fontSize: 11, fill: "#2563eb" }}
              />
              <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.avgScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">{t.regions.region}</th>
              <th className="px-4 py-2 text-right font-semibold">{t.common.companies}</th>
              <th className="px-4 py-2 text-right font-semibold">{t.common.average}</th>
              <th className="px-4 py-2 text-right font-semibold">{t.common.median}</th>
              <th className="px-4 py-2 text-right font-semibold">{t.regions.vsNational}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const diff = Math.round((r.avgScore - nationalAvg) * 10) / 10;
              return (
                <tr key={r.name} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/tableau-de-bord?region=${encodeURIComponent(r.name)}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {r.count.toLocaleString("fr-FR")}
                  </td>
                  <td className={cn("px-4 py-2 text-right font-bold", scoreColor(r.avgScore))}>
                    {r.avgScore}
                  </td>
                  <td className={cn("px-4 py-2 text-right", scoreColor(r.median))}>
                    {r.median}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        diff > 0 ? "text-emerald-600 dark:text-emerald-400" : diff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
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
    </div>
  );
}
