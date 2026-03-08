import Link from "next/link";
import type { Company } from "@/lib/types";
import { cn, scoreColor, scoreBgColor, scoreBorderColor } from "@/lib/utils";
import { Building2, MapPin, Users } from "lucide-react";

interface CompanyCardProps {
  company: Company;
  highlight?: string;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={`/entreprise/${company.siren}`}
      className={cn(
        "block rounded-lg border p-4 transition-all hover:shadow-md",
        scoreBorderColor(company.latestScore),
        scoreBgColor(company.latestScore)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{company.name}</h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {company.sector || "—"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {company.region || "—"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {company.size || "—"}
            </span>
          </div>
        </div>
        <div
          className={cn(
            "flex-shrink-0 rounded-full px-3 py-1 text-lg font-bold",
            scoreColor(company.latestScore)
          )}
        >
          {company.latestScore ?? "NC"}
        </div>
      </div>
    </Link>
  );
}
