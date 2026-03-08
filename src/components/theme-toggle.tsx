"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
