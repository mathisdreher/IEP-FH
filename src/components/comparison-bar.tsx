import { cn, scoreColor } from "@/lib/utils";

interface ComparisonBarProps {
  label: string;
  value: number | null;
  maxValue: number;
  highlight?: boolean;
}

export function ComparisonBar({ label, value, maxValue, highlight }: ComparisonBarProps) {
  const percentage = value != null ? (value / maxValue) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight ? "border-primary/30 bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("text-sm", highlight ? "font-semibold" : "text-muted-foreground")}>
          {label}
        </span>
        <span className={cn("text-sm font-bold", scoreColor(value))}>
          {value != null ? `${value}/100` : "NC"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        {value != null && (
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-700",
              value >= 85
                ? "bg-emerald-500"
                : value >= 75
                  ? "bg-green-500"
                  : value >= 50
                    ? "bg-amber-500"
                    : "bg-red-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
