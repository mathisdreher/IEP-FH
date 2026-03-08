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
