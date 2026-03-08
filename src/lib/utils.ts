import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  if (score == null) return "NC";
  return String(score);
}

export function scoreColor(score: number | null): string {
  if (score == null) return "text-gray-400 dark:text-gray-500";
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function scoreBgColor(score: number | null): string {
  if (score == null) return "bg-gray-100 dark:bg-gray-800/50";
  if (score >= 85) return "bg-emerald-50 dark:bg-emerald-900/30";
  if (score >= 75) return "bg-green-50 dark:bg-green-900/30";
  if (score >= 50) return "bg-amber-50 dark:bg-amber-900/30";
  return "bg-red-50 dark:bg-red-900/30";
}

export function scoreBorderColor(score: number | null): string {
  if (score == null) return "border-gray-200 dark:border-gray-700";
  if (score >= 85) return "border-emerald-200 dark:border-emerald-700";
  if (score >= 75) return "border-green-200 dark:border-green-700";
  if (score >= 50) return "border-amber-200 dark:border-amber-700";
  return "border-red-200 dark:border-red-700";
}
