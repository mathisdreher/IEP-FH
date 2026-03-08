import { NextResponse } from "next/server";
import { getMeta } from "@/lib/data";

export async function GET() {
  const meta = await getMeta();
  return NextResponse.json(meta, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
