"use client";

import { useTheme } from "@/components/theme-provider";

export function useChartColors() {
  const { resolved } = useTheme();
  const dark = resolved === "dark";

  return {
    grid: dark ? "#334155" : "#e5e7eb",
    text: dark ? "#94a3b8" : "#374151",
    tooltip: {
      borderRadius: "8px",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      fontSize: "14px",
      backgroundColor: dark ? "#1e293b" : "#ffffff",
      color: dark ? "#e2e8f0" : "#0f172a",
    },
  };
}
