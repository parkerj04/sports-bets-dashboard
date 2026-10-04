import { NextResponse } from "next/server";
import { backs2026 } from "@/lib/backs2026";
import { onRoster, rosterNames } from "@/lib/roster";

export const dynamic = "force-dynamic";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const awayFile = FILE[away] || away;
  const homeFile = FILE[home] || home;
  const [awayRoster, homeRoster, live] = await Promise.all([
    rosterNames(away),
    rosterNames(home),
    backs2026([awayFile, homeFile]),
  ]);
  const roster = [...awayRoster, ...homeRoster];
  return NextResponse.json({
    ...live,
    players: (live.players || []).filter((p: { name: string }) => onRoster(p.name, roster)),
  });
}
