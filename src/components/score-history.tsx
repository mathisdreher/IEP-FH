"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { YearRecord } from "@/lib/types";
import { useChartColors } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

interface ScoreHistoryProps {
  history: YearRecord[];
}

const SUB_SCORES = [
  { key: "scoreRemunerations" as const, label: "Rémunération", color: "#2563eb", max: 40 },
  { key: "scoreAugmentations" as const, label: "Augmentations", color: "#16a34a", max: 35 },
  { key: "scoreCongesMaternite" as const, label: "Congé mat.", color: "#d97706", max: 15 },
  { key: "scoreHautesRemunerations" as const, label: "Hautes rém.", color: "#7c3aed", max: 10 },
];

type ViewMode = "overall" | "breakdown";

export function ScoreHistory({ history }: ScoreHistoryProps) {
  const chartColors = useChartColors();
  const [view, setView] = useState<ViewMode>("overall");

  const overallData = history.map((r) => ({
    year: r.year,
    score: r.score,
  }));

  const breakdownData = history.map((r) => {
    const point: Record<string, number | string | null> = { year: r.year };
    for (const { key } of SUB_SCORES) {
      point[key] = r[key];
    }
    return point;
  });

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          onClick={() => setView("overall")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            view === "overall" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
          )}
        >
          Score global
        </button>
        <button
          onClick={() => setView("breakdown")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            view === "breakdown" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
          )}
        >
          Composantes
        </button>
      </div>

      <div className="h-64 w-full">
        {view === "overall" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overallData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: chartColors.text }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: chartColors.text }} tickLine={false} width={35} />
              <Tooltip formatter={(value) => [`${value}/100`, "Score"]} contentStyle={chartColors.tooltip} />
              <ReferenceLine y={75} stroke="#d97706" strokeDasharray="5 5" label={{ value: "75", position: "right", fontSize: 10, fill: "#d97706" }} />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 4 }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={breakdownData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: chartColors.text }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: chartColors.text }} tickLine={false} width={35} />
              <Tooltip contentStyle={chartColors.tooltip} />
              {SUB_SCORES.map(({ key, label, color, max }) => (
                <Line key={key} type="monotone" dataKey={key} name={`${label} (/${max})`} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} connectNulls />
              ))}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Year-by-year table */}
      {history.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-semibold text-xs">Année</th>
                <th className="px-3 py-1.5 text-right font-semibold text-xs">Score</th>
                {SUB_SCORES.map(({ label, max }) => (
                  <th key={label} className="px-3 py-1.5 text-right font-semibold text-xs">{label} /{max}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((r) => (
                <tr key={r.year} className="border-t border-border">
                  <td className="px-3 py-1.5 font-medium">{r.year}</td>
                  <td className={cn("px-3 py-1.5 text-right font-bold", r.score != null && r.score >= 75 ? "text-emerald-600 dark:text-emerald-400" : r.score != null && r.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                    {r.score ?? "NC"}
                  </td>
                  {SUB_SCORES.map(({ key }) => (
                    <td key={key} className="px-3 py-1.5 text-right text-muted-foreground">
                      {r[key] ?? "NC"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
