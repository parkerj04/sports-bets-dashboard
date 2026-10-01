import { NextResponse } from "next/server";
import coverage from "@/data/nfl-coverage.json";
import { catches2026 } from "@/lib/rec2026";

export const dynamic = "force-dynamic";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const awayFile = FILE[away] || away;
  const homeFile = FILE[home] || home;
  const teams = coverage.teams as Record<string, { zonePct: number; manPct: number; snaps: number }>;
  const players = (coverage.players as { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number }[])
    .filter((p) => p.team === awayFile || p.team === homeFile);
  const live = await catches2026([awayFile, homeFile]);
  const catches = live.players.map((p) => ({
    ...p,
    team: p.team === awayFile ? away : p.team === homeFile ? home : p.team,
  }));
  return NextResponse.json({
    source: "2025 FTN chart via nflverse. Kept for the zone and man table only.",
    liveSource: live.source,
    away: teams[awayFile] || null,
    home: teams[homeFile] || null,
    players,
    catches,
  });
}
