import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getCompany, getCompanyHistory, getSectorAvg, getRegionAvg, getNationalStats } from "@/lib/data";
import { getDictionary, type Locale } from "@/lib/i18n";
import { ScoreGauge } from "@/components/score-gauge";
import { ComparisonBar } from "@/components/comparison-bar";
import { ScoreHistory } from "@/components/score-history";
import { SubScores } from "@/components/sub-scores";
import { ShareButton } from "@/components/share-button";
import { Building2, MapPin, Users, Calendar, Hash, ArrowLeft, GitCompareArrows } from "lucide-react";

export const revalidate = 86400;

interface Props {
  params: Promise<{ siren: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siren } = await params;
  const company = await getCompany(siren);
  if (!company) return { title: "Entreprise introuvable" };
  return {
    title: `${company.name} — Score ${company.latestScore ?? "NC"}/100`,
    description: `Index Égalité Professionnelle de ${company.name} (${company.region}). Score: ${company.latestScore ?? "Non calculable"}/100.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { siren } = await params;
  const company = await getCompany(siren);
  if (!company) notFound();

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "fr") as Locale;
  const t = getDictionary(locale);

  const [history, sectorAvg, regionAvg, national] = await Promise.all([
    getCompanyHistory(siren),
    getSectorAvg(company.sectorCode),
    getRegionAvg(company.region),
    getNationalStats(),
  ]);

  const latestRecord = history.find((r) => r.year === company.latestYear);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t.company.backToSearch}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{company.name}</span>
        </nav>
        <div className="flex items-center gap-2">
          <ShareButton label={t.company.copyLink} copiedLabel={t.company.copied} />
          <Link
            href={`/comparer?siren=${company.siren}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <GitCompareArrows className="h-4 w-4" />
            <span className="hidden sm:inline">{t.company.comparePage}</span>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{company.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Hash className="h-4 w-4" />
              SIREN {company.siren}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {company.sector}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {company.department}, {company.region}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {company.size} {t.common.employees}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {t.company.dataYear} {company.latestYear}
            </span>
          </div>
        </div>
        <ScoreGauge score={company.latestScore} size="lg" />
      </div>

      {/* Sub-scores */}
      {latestRecord && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">{t.company.indicators}</h2>
          <SubScores record={latestRecord} size={company.size} />
        </section>
      )}

      {/* Comparisons */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">{t.company.comparison}</h2>
        <div className="space-y-3">
          <ComparisonBar
            label={t.company.companyScore}
            value={company.latestScore}
            maxValue={100}
            highlight
          />
          <ComparisonBar
            label={`${t.company.sectorAvg} (${company.sector})`}
            value={sectorAvg}
            maxValue={100}
          />
          <ComparisonBar
            label={`${t.company.regionAvg} ${company.region}`}
            value={regionAvg}
            maxValue={100}
          />
          <ComparisonBar
            label={t.company.nationalAvg}
            value={national.avgScore}
            maxValue={100}
          />
        </div>
      </section>

      {/* Score history */}
      {history.length >= 1 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">{t.company.scoreHistory}</h2>
          <ScoreHistory history={history} />
        </section>
      )}
    </div>
  );
}
