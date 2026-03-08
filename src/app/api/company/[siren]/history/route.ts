import { NextResponse } from "next/server";
import { getCompanyHistory } from "@/lib/data";

interface Props {
  params: Promise<{ siren: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { siren } = await params;
  const history = await getCompanyHistory(siren);
  return NextResponse.json(history, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
