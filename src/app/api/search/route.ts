import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { getCompanies } from "@/lib/data";
import type { Company } from "@/lib/types";

let fuseInstance: Fuse<Company> | null = null;

async function getFuse(): Promise<Fuse<Company>> {
  if (fuseInstance) return fuseInstance;
  const companies = await getCompanies();
  fuseInstance = new Fuse(companies, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "siren", weight: 0.3 },
      { name: "sector", weight: 0.1 },
      { name: "region", weight: 0.1 },
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return fuseInstance;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const region = searchParams.get("region");
  const sector = searchParams.get("sector");
  const size = searchParams.get("size");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const companies = await getCompanies();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { results: [], total: 0, totalCompanies: companies.length },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  }

  const fuse = await getFuse();
  let results = fuse.search(q, { limit: 200 });

  // Apply filters
  if (region) {
    results = results.filter((r) => r.item.region === region);
  }
  if (sector) {
    results = results.filter((r) => r.item.sectorCode === sector);
  }
  if (size) {
    results = results.filter((r) => r.item.size === size);
  }

  const total = results.length;
  const items = results.slice(0, limit).map((r) => r.item);

  return NextResponse.json(
    { results: items, total, totalCompanies: companies.length },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
