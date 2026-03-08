"use client";

import { cn, scoreColor } from "@/lib/utils";
import { useTheme } from "./theme-provider";

interface ScoreGaugeProps {
  score: number | null;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ScoreGauge({ score, max = 100, size = "md", label }: ScoreGaugeProps) {
  const { resolved } = useTheme();
  const dark = resolved === "dark";
  const dimensions = { sm: 80, md: 120, lg: 160 };
  const dim = dimensions[size];
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = score != null ? (score / max) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  const gaugeColor =
    score == null
      ? (dark ? "#4b5563" : "#d1d5db")
      : score / max >= 0.85
        ? "#059669"
        : score / max >= 0.75
          ? "#16a34a"
          : score / max >= 0.5
            ? "#d97706"
            : "#dc2626";

  const trackColor = dark ? "#334155" : "#e5e7eb";
  const fontSize = size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {score != null && (
            <circle
              cx={dim / 2}
              cy={dim / 2}
              r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
              style={{ animation: "gauge-fill 1s ease-out" }}
            />
          )}
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center",
            fontSize,
            "font-bold",
            scoreColor(score)
          )}
        >
          {score != null ? score : "NC"}
          {max !== 100 && score != null && (
            <span className="text-xs text-muted-foreground font-normal">/{max}</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center max-w-[120px]">
          {label}
        </span>
      )}
    </div>
  );
}
