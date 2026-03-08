"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { YearRecord } from "@/lib/types";
import { useChartColors } from "@/lib/chart-colors";

interface ScoreHistoryProps {
  history: YearRecord[];
}

export function ScoreHistory({ history }: ScoreHistoryProps) {
  const chartColors = useChartColors();

  const data = history.map((r) => ({
    year: r.year,
    score: r.score,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: chartColors.text }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: chartColors.text }}
            tickLine={false}
            width={35}
          />
          <Tooltip
            formatter={(value) => [`${value}/100`, "Score"]}
            contentStyle={chartColors.tooltip}
          />
          <ReferenceLine y={75} stroke="#d97706" strokeDasharray="5 5" label={{ value: "75", position: "right", fontSize: 10, fill: "#d97706" }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ fill: "#2563eb", r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
