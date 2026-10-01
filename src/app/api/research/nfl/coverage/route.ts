import { NextResponse } from "next/server";
import coverage from "@/data/nfl-coverage.json";
import spots from "@/data/target-spots.json";

export const dynamic = "force-dynamic";

const GONE = new Set(["C.Austin", "J.Smith", "Calvin Austin", "Jonnu Smith"]);

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const teams = coverage.teams as Record<string, { zonePct: number; manPct: number; snaps: number }>;
  const players = (coverage.players as { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number }[])
    .filter((p) => (p.team === away || p.team === home) && !GONE.has(p.name));
  const maps = (spots.players as { name: string; team: string; spots: { x: number; y: number; n: number; tag: string }[] }[])
    .filter((p) => p.team === away || p.team === home);
  return NextResponse.json({
    source: "Coverage file is the last full charted season. 2026 games already played are not in that FTN extract.",
    note: spots.source,
    away: teams[away] || null,
    home: teams[home] || null,
    players,
    spots: maps,
  });
}
