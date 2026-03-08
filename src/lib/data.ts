import { promises as fs } from "fs";
import path from "path";
import type {
  Company,
  YearRecord,
  SectorStats,
  RegionStats,
  NationalStats,
  DataMeta,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

let companiesCache: Company[] | null = null;
let yearCache = new Map<number, YearRecord[]>();

export async function getCompanies(): Promise<Company[]> {
  if (companiesCache) return companiesCache;
  const raw = await fs.readFile(path.join(DATA_DIR, "companies.json"), "utf-8");
  companiesCache = JSON.parse(raw) as Company[];
  return companiesCache;
}

export async function getCompany(siren: string): Promise<Company | undefined> {
  const companies = await getCompanies();
  return companies.find((c) => c.siren === siren);
}

export async function getYearRecords(year: number): Promise<YearRecord[]> {
  if (yearCache.has(year)) return yearCache.get(year)!;
  const filePath = path.join(DATA_DIR, "by-year", `${year}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const records = JSON.parse(raw) as YearRecord[];
    yearCache.set(year, records);
    return records;
  } catch {
    return [];
  }
}

export async function getCompanyHistory(siren: string): Promise<YearRecord[]> {
  const meta = await getMeta();
  const records: YearRecord[] = [];
  for (const year of meta.years) {
    const yearRecords = await getYearRecords(year);
    const found = yearRecords.find((r) => r.siren === siren);
    if (found) records.push(found);
  }
  return records.sort((a, b) => a.year - b.year);
}

export async function getSectorStats(): Promise<SectorStats[]> {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "stats", "sectors.json"),
    "utf-8"
  );
  return JSON.parse(raw) as SectorStats[];
}

export async function getRegionStats(): Promise<RegionStats[]> {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "stats", "regions.json"),
    "utf-8"
  );
  return JSON.parse(raw) as RegionStats[];
}

export async function getNationalStats(): Promise<NationalStats> {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "stats", "national.json"),
    "utf-8"
  );
  return JSON.parse(raw) as NationalStats;
}

export async function getMeta(): Promise<DataMeta> {
  const raw = await fs.readFile(path.join(DATA_DIR, "meta.json"), "utf-8");
  return JSON.parse(raw) as DataMeta;
}

export async function getSectorAvg(sectorCode: string): Promise<number | null> {
  const stats = await getSectorStats();
  const sector = stats.find((s) => s.code === sectorCode);
  return sector?.avgScore ?? null;
}

export async function getRegionAvg(region: string): Promise<number | null> {
  const stats = await getRegionStats();
  const r = stats.find((s) => s.name === region);
  return r?.avgScore ?? null;
}

export async function getFilteredDashboardStats(
  filters: { region?: string; size?: string }
): Promise<{
  stats: NationalStats;
  topSectors: { code: string; label: string; count: number; avgScore: number }[];
  bottomSectors: { code: string; label: string; count: number; avgScore: number }[];
}> {
  const meta = await getMeta();
  const companies = await getCompanies();

  let filtered = companies;
  if (filters.region) filtered = filtered.filter((c) => c.region === filters.region);
  if (filters.size) filtered = filtered.filter((c) => c.size === filters.size);

  const withScore = filtered.filter((c) => c.latestScore != null);
  const scores = withScore.map((c) => c.latestScore!).sort((a, b) => a - b);

  const distribution: Record<string, number> = {
    "0-25": 0, "26-50": 0, "51-75": 0, "76-85": 0, "86-100": 0,
  };
  for (const s of scores) {
    if (s <= 25) distribution["0-25"]++;
    else if (s <= 50) distribution["26-50"]++;
    else if (s <= 75) distribution["51-75"]++;
    else if (s <= 85) distribution["76-85"]++;
    else distribution["86-100"]++;
  }

  const countByYear: Record<number, number> = {};
  const avgByYear: Record<number, number> = {};
  for (const year of meta.years) {
    const yearRecords = await getYearRecords(year);
    let yf = yearRecords;
    if (filters.region) yf = yf.filter((r) => r.region === filters.region);
    if (filters.size) yf = yf.filter((r) => r.size === filters.size);
    const ys = yf.filter((r) => r.score != null);
    countByYear[year] = yf.length;
    if (ys.length > 0) {
      avgByYear[year] =
        Math.round((ys.reduce((sum, r) => sum + r.score!, 0) / ys.length) * 10) / 10;
    }
  }

  const sectorMap = new Map<string, { code: string; label: string; scores: number[] }>();
  for (const c of withScore) {
    if (!sectorMap.has(c.sectorCode)) {
      sectorMap.set(c.sectorCode, { code: c.sectorCode, label: c.sector, scores: [] });
    }
    sectorMap.get(c.sectorCode)!.scores.push(c.latestScore!);
  }
  const sectorList = Array.from(sectorMap.values())
    .filter((s) => s.scores.length >= 3)
    .map((s) => ({
      code: s.code,
      label: s.label,
      count: s.scores.length,
      avgScore:
        Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10,
    }));

  const topSectors = [...sectorList].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  const bottomSectors = [...sectorList].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5);

  return {
    stats: {
      year: meta.latestYear,
      totalCompanies: filtered.length,
      totalWithScore: withScore.length,
      avgScore:
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : 0,
      median: scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0,
      distribution,
      years: meta.years,
      countByYear,
      avgByYear,
    },
    topSectors,
    bottomSectors,
  };
}
