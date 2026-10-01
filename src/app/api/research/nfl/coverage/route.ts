import { NextResponse } from "next/server";
import coverage from "@/data/nfl-coverage.json";
import { catches2026 } from "@/lib/rec2026";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const teams = coverage.teams as Record<string, { zonePct: number; manPct: number; snaps: number }>;
  const players = (coverage.players as { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number }[])
    .filter((p) => p.team === away || p.team === home);
  const live = await catches2026([away, home]);
  return NextResponse.json({
    source: "2025 FTN chart via nflverse. Kept for the zone and man table only.",
    liveSource: live.source,
    away: teams[away] || null,
    home: teams[home] || null,
    players,
    catches: live.players,
  });
}
