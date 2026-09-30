import { NextResponse } from "next/server";
import coverage from "@/data/nfl-coverage.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const teams = coverage.teams as Record<string, { zonePct: number; manPct: number; snaps: number }>;
  const players = (coverage.players as { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number }[])
    .filter((p) => p.team === away || p.team === home);
  return NextResponse.json({
    source: coverage.source,
    away: teams[away] || null,
    home: teams[home] || null,
    players,
  });
}
