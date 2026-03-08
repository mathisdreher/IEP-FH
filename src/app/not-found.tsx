"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
      <p className="mt-4 text-lg font-medium">{t.company.notFound}</p>
      <p className="mt-1 text-muted-foreground">
        {t.company.notFoundDesc}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Search className="h-4 w-4" />
        {t.company.searchButton}
      </Link>
    </div>
  );
}
