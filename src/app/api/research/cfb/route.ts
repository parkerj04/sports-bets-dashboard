import { NextResponse } from "next/server";
import { getCfbWeek } from "@/lib/cfb";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getCfbWeek()); }
  catch (e) { console.error(e); return NextResponse.json({ week: 0, games: [], error: "CFB fetch failed" }, { status: 500 }); }
}
