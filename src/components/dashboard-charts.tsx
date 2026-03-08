"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import type { NationalStats } from "@/lib/types";
import { useLanguage } from "@/components/language-provider";
import { useChartColors } from "@/lib/chart-colors";

interface DashboardChartsProps {
  national: NationalStats;
}

const DIST_COLORS: Record<string, string> = {
  "0-25": "#dc2626",
  "26-50": "#f97316",
  "51-75": "#eab308",
  "76-85": "#22c55e",
  "86-100": "#059669",
};

export function DashboardCharts({ national }: DashboardChartsProps) {
  const { t } = useLanguage();
  const chartColors = useChartColors();

  // Year-over-year trend
  const trendData = national.years.map((y) => ({
    year: y,
    avg: national.avgByYear[y],
    count: national.countByYear[y],
  }));

  // Score distribution
  const distData = Object.entries(national.distribution).map(([range, count]) => ({
    range,
    count,
    fill: DIST_COLORS[range] || "#6b7280",
  }));

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      {/* Trend */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-4">{t.dashboard.scoreTrend}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: chartColors.text }} />
              <YAxis domain={[75, 95]} tick={{ fontSize: 12, fill: chartColors.text }} width={35} />
              <Tooltip
                formatter={(v, name) => {
                  if (name === "avg") return [`${v}/100`, t.dashboard.avgScoreLabel];
                  return [Number(v).toLocaleString("fr-FR"), t.common.companies];
                }}
                contentStyle={chartColors.tooltip}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ fill: "#2563eb", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution */}
      <div className="rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-4">{t.dashboard.scoreDistribution} ({national.year})</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: chartColors.text }} />
              <YAxis tick={{ fontSize: 12, fill: chartColors.text }} width={50} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString("fr-FR"), t.common.companies]}
                contentStyle={chartColors.tooltip}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Companies count trend */}
      <div className="rounded-lg border border-border p-4 lg:col-span-2">
        <h3 className="font-semibold mb-4">{t.dashboard.companiesPerYear}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: chartColors.text }} />
              <YAxis tick={{ fontSize: 12, fill: chartColors.text }} width={50} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString("fr-FR"), t.common.companies]}
                contentStyle={chartColors.tooltip}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
