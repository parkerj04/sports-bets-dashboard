import { NextResponse } from "next/server";
import { nflTrends } from "@/lib/trends";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = q.get("away") || "";
  const home = q.get("home") || "";
  const teams = away && home ? [away, home] : undefined;
  const trends = await nflTrends(teams);
  return NextResponse.json({
    source: "nflverse 2026 play-by-play. Line is the player's own median, not a sportsbook number. Rank is last-5 hit rate at that median.",
    trends,
  });
}
