import { getRegionStats, getNationalStats } from "@/lib/data";
import { cookies } from "next/headers";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import { RegionMap } from "@/components/region-map";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Régions",
  description: "Comparez les scores d'égalité professionnelle par région.",
};

export default async function RegionsPage() {
  const [regions, national] = await Promise.all([
    getRegionStats(),
    getNationalStats(),
  ]);

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "fr") as Locale;
  const t = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t.regions.title}</h1>
      <p className="mt-1 text-muted-foreground">
        {t.regions.subtitle} ({national.year})
      </p>

      <div className="mt-4 rounded-lg border border-border bg-accent/50 p-3 text-sm">
        <strong>{t.regions.nationalAvg} :</strong>{" "}
        <span className="font-bold text-primary">{national.avgScore}/100</span>
      </div>

      <RegionMap regions={regions} nationalAvg={national.avgScore} />
    </div>
  );
}
