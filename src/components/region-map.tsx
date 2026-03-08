"use client";

import { useState } from "react";
import { cn, scoreColor } from "@/lib/utils";
import type { RegionStats } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";
import { useChartColors } from "@/lib/chart-colors";
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

// Realistic SVG paths for metropolitan French regions (approximate geographic outlines)
const REGION_PATHS: Record<string, { d: string; cx: number; cy: number }> = {
  "Hauts-de-France": {
    d: "M300,20 L310,15 330,12 350,18 368,10 385,15 400,30 408,50 402,72 395,88 382,100 370,115 358,125 345,132 332,138 318,142 305,145 292,138 280,130 272,118 268,105 270,90 275,72 282,55 290,38Z",
    cx: 338, cy: 80,
  },
  "Normandie": {
    d: "M140,110 L158,105 178,100 198,98 218,95 238,92 258,100 268,105 270,90 275,72 280,82 272,118 280,130 275,145 265,158 250,170 235,178 218,185 200,188 180,190 160,182 142,172 128,160 120,145 125,128Z",
    cx: 200, cy: 145,
  },
  "Île-de-France": {
    d: "M280,130 L292,138 305,145 318,142 332,138 340,148 342,162 338,175 330,185 318,192 305,195 292,190 282,180 275,168 275,155 275,145Z",
    cx: 308, cy: 165,
  },
  "Grand Est": {
    d: "M345,132 L358,125 370,115 382,100 395,88 402,72 408,50 418,42 432,38 448,42 462,52 472,65 480,82 486,100 490,120 492,142 490,165 486,188 480,208 472,225 462,240 450,252 435,260 420,258 408,248 398,235 388,218 380,200 368,185 358,172 348,162 342,162 340,148 340,140Z",
    cx: 430, cy: 155,
  },
  "Bretagne": {
    d: "M42,190 L58,178 72,170 88,165 105,162 120,160 128,160 142,172 148,185 145,200 138,215 128,228 115,238 100,245 82,248 65,245 48,238 35,228 28,215 32,198Z",
    cx: 90, cy: 206,
  },
  "Pays de la Loire": {
    d: "M65,245 L82,248 100,245 115,238 128,228 138,215 145,200 148,185 160,182 180,190 200,188 218,185 232,195 238,210 235,230 232,250 225,268 215,285 200,298 182,305 162,308 142,305 122,295 105,282 88,268 75,255Z",
    cx: 162, cy: 252,
  },
  "Centre-Val de Loire": {
    d: "M235,178 L250,170 265,158 275,145 275,155 275,168 282,180 292,190 305,195 318,192 330,185 338,175 345,185 350,200 352,218 350,238 345,255 338,272 328,285 315,292 300,295 285,292 270,285 258,272 248,258 240,242 235,225 232,210 232,195Z",
    cx: 292, cy: 235,
  },
  "Bourgogne-Franche-Comté": {
    d: "M338,175 L348,162 358,172 368,185 380,200 388,218 398,235 408,248 420,258 435,260 445,272 450,288 448,305 442,322 432,335 418,345 405,348 392,345 378,338 365,328 355,315 348,300 342,282 340,262 342,242 345,222 345,200 342,185Z",
    cx: 395, cy: 272,
  },
  "Nouvelle-Aquitaine": {
    d: "M88,268 L105,282 122,295 142,305 162,308 182,305 200,298 215,285 232,250 248,258 258,272 270,285 285,292 300,295 295,312 288,332 282,352 278,372 272,392 265,410 258,428 248,445 235,460 220,472 202,482 185,488 168,490 152,485 140,475 128,460 118,442 108,420 100,398 92,375 85,352 82,328 80,305 82,285Z",
    cx: 188, cy: 392,
  },
  "Auvergne-Rhône-Alpes": {
    d: "M328,285 L338,272 345,255 350,238 352,218 355,228 365,328 378,338 392,345 405,348 418,345 432,335 445,340 455,352 462,368 465,385 462,402 455,415 445,425 432,430 418,432 402,428 388,420 375,410 362,398 350,385 340,370 332,352 328,335 325,315 325,298Z",
    cx: 392, cy: 365,
  },
  "Occitanie": {
    d: "M152,485 L168,490 185,488 202,482 220,472 235,460 248,445 258,428 265,410 272,392 278,372 282,352 288,332 295,312 300,295 315,292 325,298 325,315 328,335 332,352 340,370 348,382 345,398 338,415 328,432 315,448 298,462 280,472 262,480 242,485 222,488 202,490 182,488 165,488Z",
    cx: 255, cy: 432,
  },
  "Provence-Alpes-Côte d'Azur": {
    d: "M388,420 L402,428 418,432 432,430 445,425 455,415 462,402 472,395 485,392 498,398 508,410 512,425 510,442 502,455 492,465 478,472 462,475 448,472 432,468 418,462 405,455 395,445 390,432Z",
    cx: 450, cy: 435,
  },
  "Corse": {
    d: "M498,478 L505,472 512,470 518,475 522,485 524,498 522,512 518,525 512,535 505,540 500,535 498,522 496,508 496,495 498,485Z",
    cx: 510, cy: 505,
  },
};

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
                  <Link key={name} href={`/?region=${encodeURIComponent(name)}`}>
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
                      href={`/?region=${encodeURIComponent(name)}`}
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
                      href={`/?region=${encodeURIComponent(r.name)}`}
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
