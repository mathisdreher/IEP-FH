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
  if (score == null) return "text-gray-400";
  if (score >= 85) return "text-emerald-600";
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function scoreBgColor(score: number | null): string {
  if (score == null) return "bg-gray-100";
  if (score >= 85) return "bg-emerald-50";
  if (score >= 75) return "bg-green-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

export function scoreBorderColor(score: number | null): string {
  if (score == null) return "border-gray-200";
  if (score >= 85) return "border-emerald-200";
  if (score >= 75) return "border-green-200";
  if (score >= 50) return "border-amber-200";
  return "border-red-200";
}
