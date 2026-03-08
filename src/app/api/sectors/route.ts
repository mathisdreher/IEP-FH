import { NextResponse } from "next/server";
import { getSectorStats } from "@/lib/data";

export async function GET() {
  const sectors = await getSectorStats();
  return NextResponse.json(sectors, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
