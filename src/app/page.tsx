"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, Database } from "lucide-react";
import { CompanyCard } from "@/components/company-card";
import type { Company } from "@/lib/types";
import { REGIONS, SIZE_CATEGORIES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

export default function HomePage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [region, setRegion] = useState("");
  const [size, setSize] = useState("");
  const [totalCompanies, setTotalCompanies] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/search?q=__meta__&limit=0")
      .then((r) => r.json())
      .then((d) => setTotalCompanies(d.totalCompanies))
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string, r: string, s: string) => {
    if (q.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "30" });
      if (r) params.set("region", r);
      if (s) params.set("size", s);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query, region, size), 300);
    return () => clearTimeout(timeout);
  }, [query, region, size, search]);

  const hasFilters = region || size;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t.home.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t.home.subtitle}
        </p>
        {totalCompanies && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            {totalCompanies.toLocaleString()} {t.home.indexed}
          </p>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t.home.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-20 text-base shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          autoFocus
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 transition-colors",
            hasFilters
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="">{t.home.allRegions}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="">{t.home.allSizes}</option>
            {SIZE_CATEGORIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setRegion("");
                setSize("");
              }}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
              {t.common.reset}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-muted" />
                    <div className="h-3 w-72 rounded bg-muted" />
                  </div>
                  <div className="h-8 w-12 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            {t.home.noResultsFor} &quot;{query}&quot;
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {total} {total > 1 ? t.common.results : t.common.result}
              {total > results.length && ` (${results.length} ${t.common.displayed})`}
            </p>
            <div className="space-y-2">
              {results.map((company) => (
                <CompanyCard key={company.siren} company={company} />
              ))}
            </div>
          </>
        )}

        {!loading && query.length < 2 && (
          <div className="py-12 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p>{t.home.minChars}</p>
          </div>
        )}
      </div>
    </div>
  );
}
