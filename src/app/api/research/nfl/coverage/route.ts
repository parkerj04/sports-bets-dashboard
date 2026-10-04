import { NextResponse } from "next/server";
import coverage from "@/data/nfl-coverage.json";
import { catches2026 } from "@/lib/rec2026";
import { onRoster, rosterNames } from "@/lib/roster";

export const dynamic = "force-dynamic";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const awayFile = FILE[away] || away;
  const homeFile = FILE[home] || home;
  const teams = coverage.teams as Record<string, { zonePct: number; manPct: number; snaps: number }>;
  const [awayRoster, homeRoster, live] = await Promise.all([
    rosterNames(away),
    rosterNames(home),
    catches2026([awayFile, homeFile]),
  ]);
  const roster = [...awayRoster, ...homeRoster];
  const players = (coverage.players as { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number }[])
    .filter((p) => (p.team === awayFile || p.team === homeFile) && onRoster(p.name, roster));
  const catches = live.players
    .filter((p) => onRoster(p.name, roster))
    .map((p) => ({ ...p, team: p.team === awayFile ? away : p.team === homeFile ? home : p.team }));
  return NextResponse.json({
    source: "2025 chart kept for zone and man only. Names not on the live ESPN roster are removed.",
    liveSource: live.source,
    away: teams[awayFile] || null,
    home: teams[homeFile] || null,
    players,
    catches,
    rosterCount: roster.length,
  });
}
