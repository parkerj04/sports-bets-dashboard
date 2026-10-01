import { NextResponse } from "next/server";
import { nflTrends } from "@/lib/trends";

export const dynamic = "force-dynamic";

export async function GET() {
  const trends = await nflTrends();
  return NextResponse.json({
    source: "nflverse 2026 play-by-play. Line is the player's own median, not a sportsbook number. Rank is last-5 hit rate at that median.",
    trends,
  });
}
