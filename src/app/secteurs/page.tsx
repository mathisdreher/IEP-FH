import { getSectorStats, getNationalStats } from "@/lib/data";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import { SectorTable } from "@/components/sector-table";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Secteurs d'activité",
  description: "Comparez les scores d'égalité professionnelle par secteur d'activité.",
};

export default async function SecteursPage() {
  const [sectors, national] = await Promise.all([
    getSectorStats(),
    getNationalStats(),
  ]);

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "fr") as Locale;
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.secteurs.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {t.secteurs.subtitle} ({national.year})
      </p>

      <div className="mt-4 rounded-lg border border-border bg-accent/50 p-3 text-sm">
        <strong>{t.secteurs.nationalAvg} :</strong>{" "}
        <span className="font-bold text-primary">{national.avgScore}/100</span>
        {" — "}
        {national.totalWithScore.toLocaleString("fr-FR")} {t.secteurs.companiesWithScore}
      </div>

      <div className="mt-6">
        <SectorTable sectors={sectors} nationalAvg={national.avgScore} />
      </div>
    </div>
  );
}
