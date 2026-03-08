import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const DATASET_ID = "61a73dcfe3171089843587bf";
const DATA_GOUV_API = "https://www.data.gouv.fr/api/1";
const XLSX_URL = "https://egapro.travail.gouv.fr/index-egalite-fh.xlsx";
const DATA_DIR = path.join(process.cwd(), "data");

interface RawRow {
  Année: number;
  Structure: string;
  "Tranche d'effectifs": string;
  SIREN: string;
  "Raison Sociale": string;
  "Nom UES": string | null;
  "Entreprises UES (SIREN)": string | null;
  Région: string;
  Département: string;
  Pays: string;
  "Code NAF": string;
  "Note Ecart rémunération": number | null;
  "Note Ecart taux d'augmentation (hors promotion)": number | null;
  "Note Ecart taux de promotion": number | null;
  "Note Ecart taux d'augmentation": number | null;
  "Note Retour congé maternité": number | null;
  "Note Hautes rémunérations": number | null;
  "Note Index": number | null;
}

export interface Company {
  siren: string;
  name: string;
  sector: string;
  sectorCode: string;
  region: string;
  department: string;
  size: string;
  structure: string;
  latestYear: number;
  latestScore: number | null;
  years: number[];
}

export interface YearRecord {
  siren: string;
  name: string;
  sector: string;
  sectorCode: string;
  region: string;
  department: string;
  size: string;
  structure: string;
  year: number;
  score: number | null;
  scoreRemunerations: number | null;
  scoreAugmentations: number | null;
  scoreAugmentationsHP: number | null;
  scorePromotions: number | null;
  scoreCongesMaternite: number | null;
  scoreHautesRemunerations: number | null;
  uesName: string | null;
  uesSirens: string | null;
}

interface SectorStats {
  code: string;
  label: string;
  count: number;
  avgScore: number;
  median: number;
  min: number;
  max: number;
  distribution: Record<string, number>;
}

interface RegionStats {
  name: string;
  count: number;
  avgScore: number;
  median: number;
  distribution: Record<string, number>;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) return reject(new Error("Redirect without location"));
        file.close();
        fs.unlinkSync(dest);
        downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function safeNumber(val: unknown): number | null {
  if (val == null || val === "" || val === "NC" || val === "nc") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function extractSectorCode(nafString: string): string {
  if (!nafString) return "";
  const match = nafString.match(/^([\d.]+[A-Z]?)/);
  return match ? match[1] : nafString;
}

function extractSectorLabel(nafString: string): string {
  if (!nafString) return "Inconnu";
  const match = nafString.match(/^[\d.]+[A-Z]?\s*-\s*(.+)$/);
  return match ? match[1].trim() : nafString;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function computeDistribution(scores: number[]): Record<string, number> {
  const buckets: Record<string, number> = {
    "0-25": 0,
    "26-50": 0,
    "51-75": 0,
    "76-85": 0,
    "86-100": 0,
  };
  for (const s of scores) {
    if (s <= 25) buckets["0-25"]++;
    else if (s <= 50) buckets["26-50"]++;
    else if (s <= 75) buckets["51-75"]++;
    else if (s <= 85) buckets["76-85"]++;
    else buckets["86-100"]++;
  }
  return buckets;
}

async function fetchDatasetMeta(): Promise<{ lastModified: string }> {
  return new Promise((resolve, reject) => {
    https.get(`${DATA_GOUV_API}/datasets/${DATASET_ID}/`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ lastModified: json.last_modified });
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("🔍 Checking dataset metadata...");
  const meta = await fetchDatasetMeta();
  console.log(`  Last modified: ${meta.lastModified}`);

  // Check if we need to update
  const metaPath = path.join(DATA_DIR, "meta.json");
  if (fs.existsSync(metaPath)) {
    const existing = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (existing.lastModified === meta.lastModified && !process.argv.includes("--force")) {
      console.log("✅ Data is up to date. Use --force to re-download.");
      return;
    }
  }

  // Ensure data directory exists
  for (const dir of [DATA_DIR, path.join(DATA_DIR, "by-year"), path.join(DATA_DIR, "stats")]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Download XLSX
  const xlsxPath = path.join(DATA_DIR, "raw.xlsx");
  console.log("📥 Downloading XLSX file...");
  await downloadFile(XLSX_URL, xlsxPath);
  console.log("  Downloaded successfully");

  // Parse XLSX
  console.log("📊 Parsing XLSX...");
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[sheetName]);
  console.log(`  Parsed ${rows.length} rows`);

  // Process rows into structured data
  const companiesMap = new Map<string, Company>();
  const yearRecordsMap = new Map<number, YearRecord[]>();
  const allYears = new Set<number>();

  for (const row of rows) {
    const siren = String(row.SIREN || "").trim();
    if (!siren) continue;

    const year = Number(row["Année"]);
    if (!year || isNaN(year)) continue;
    allYears.add(year);

    const sectorCode = extractSectorCode(row["Code NAF"] || "");
    const sectorLabel = extractSectorLabel(row["Code NAF"] || "");
    const score = safeNumber(row["Note Index"]);

    const record: YearRecord = {
      siren,
      name: (row["Raison Sociale"] || "").trim(),
      sector: sectorLabel,
      sectorCode,
      region: (row["Région"] || "").trim(),
      department: (row["Département"] || "").trim(),
      size: (row["Tranche d'effectifs"] || "").trim(),
      structure: (row["Structure"] || "").trim(),
      year,
      score,
      scoreRemunerations: safeNumber(row["Note Ecart rémunération"]),
      scoreAugmentationsHP: safeNumber(row["Note Ecart taux d'augmentation (hors promotion)"]),
      scorePromotions: safeNumber(row["Note Ecart taux de promotion"]),
      scoreAugmentations: safeNumber(row["Note Ecart taux d'augmentation"]),
      scoreCongesMaternite: safeNumber(row["Note Retour congé maternité"]),
      scoreHautesRemunerations: safeNumber(row["Note Hautes rémunérations"]),
      uesName: row["Nom UES"] || null,
      uesSirens: row["Entreprises UES (SIREN)"] || null,
    };

    if (!yearRecordsMap.has(year)) yearRecordsMap.set(year, []);
    yearRecordsMap.get(year)!.push(record);

    // Build company index (keep latest year info)
    const existing = companiesMap.get(siren);
    if (!existing || year > existing.latestYear) {
      companiesMap.set(siren, {
        siren,
        name: record.name,
        sector: record.sector,
        sectorCode: record.sectorCode,
        region: record.region,
        department: record.department,
        size: record.size,
        structure: record.structure,
        latestYear: year,
        latestScore: score,
        years: existing ? [...existing.years, year].sort() : [year],
      });
    } else {
      existing.years = [...new Set([...existing.years, year])].sort();
    }
  }

  // Write companies index
  const companies = Array.from(companiesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  );
  console.log(`  ${companies.length} unique companies`);

  fs.writeFileSync(
    path.join(DATA_DIR, "companies.json"),
    JSON.stringify(companies)
  );

  // Write year files
  const sortedYears = Array.from(allYears).sort();
  for (const year of sortedYears) {
    const records = yearRecordsMap.get(year) || [];
    fs.writeFileSync(
      path.join(DATA_DIR, "by-year", `${year}.json`),
      JSON.stringify(records)
    );
    console.log(`  Year ${year}: ${records.length} records`);
  }

  // Compute sector stats (latest year only)
  const latestYear = Math.max(...sortedYears);
  const latestRecords = yearRecordsMap.get(latestYear) || [];

  const sectorMap = new Map<string, { label: string; scores: number[] }>();
  for (const r of latestRecords) {
    if (r.score == null) continue;
    const key = r.sectorCode;
    if (!sectorMap.has(key)) sectorMap.set(key, { label: r.sector, scores: [] });
    sectorMap.get(key)!.scores.push(r.score);
  }

  const sectorStats: SectorStats[] = Array.from(sectorMap.entries())
    .map(([code, { label, scores }]) => ({
      code,
      label,
      count: scores.length,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      median: computeMedian(scores),
      min: Math.min(...scores),
      max: Math.max(...scores),
      distribution: computeDistribution(scores),
    }))
    .filter((s) => s.count >= 3)
    .sort((a, b) => b.count - a.count);

  fs.writeFileSync(
    path.join(DATA_DIR, "stats", "sectors.json"),
    JSON.stringify(sectorStats)
  );
  console.log(`  ${sectorStats.length} sectors with stats`);

  // Compute region stats
  const regionMap = new Map<string, number[]>();
  for (const r of latestRecords) {
    if (r.score == null || !r.region) continue;
    if (!regionMap.has(r.region)) regionMap.set(r.region, []);
    regionMap.get(r.region)!.push(r.score);
  }

  const regionStats: RegionStats[] = Array.from(regionMap.entries())
    .map(([name, scores]) => ({
      name,
      count: scores.length,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      median: computeMedian(scores),
      distribution: computeDistribution(scores),
    }))
    .sort((a, b) => b.count - a.count);

  fs.writeFileSync(
    path.join(DATA_DIR, "stats", "regions.json"),
    JSON.stringify(regionStats)
  );
  console.log(`  ${regionStats.length} regions with stats`);

  // Compute national stats
  const allScores = latestRecords
    .map((r) => r.score)
    .filter((s): s is number => s != null);
  const nationalStats = {
    year: latestYear,
    totalCompanies: companies.length,
    totalWithScore: allScores.length,
    avgScore: Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10,
    median: computeMedian(allScores),
    distribution: computeDistribution(allScores),
    years: sortedYears,
    countByYear: Object.fromEntries(
      sortedYears.map((y) => [y, (yearRecordsMap.get(y) || []).length])
    ),
    avgByYear: Object.fromEntries(
      sortedYears.map((y) => {
        const scores = (yearRecordsMap.get(y) || [])
          .map((r) => r.score)
          .filter((s): s is number => s != null);
        return [
          y,
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0,
        ];
      })
    ),
  };

  fs.writeFileSync(
    path.join(DATA_DIR, "stats", "national.json"),
    JSON.stringify(nationalStats)
  );

  // Write meta
  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      lastModified: meta.lastModified,
      fetchedAt: new Date().toISOString(),
      datasetId: DATASET_ID,
      sourceUrl: XLSX_URL,
      totalRows: rows.length,
      totalCompanies: companies.length,
      years: sortedYears,
      latestYear,
    }, null, 2)
  );

  // Remove raw XLSX to save space in repo
  fs.unlinkSync(xlsxPath);
  console.log("\n✅ Data pipeline complete!");
  console.log(`  Companies: ${companies.length}`);
  console.log(`  Years: ${sortedYears.join(", ")}`);
  console.log(`  Latest year avg score: ${nationalStats.avgScore}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
