import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getNflWeek());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ week: 0, games: [], error: "NFL fetch failed" }, { status: 500 });
  }
}
