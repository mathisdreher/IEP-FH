"use client";

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

export function RegionMap({ regions, nationalAvg }: RegionMapProps) {
  const { t } = useLanguage();
  const chartColors = useChartColors();
  const sorted = [...regions].sort((a, b) => b.avgScore - a.avgScore);

  const chartData = sorted.map((r) => ({
    name: r.name,
    avgScore: r.avgScore,
    count: r.count,
  }));

  return (
    <div className="mt-6 space-y-8">
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
                        diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"
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
