import { NextResponse } from "next/server";
import { cfbReceivers } from "@/lib/cfb-rec";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ players: [], source: "Missing game." });
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${id}`, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ players: [], source: "Game summary did not load." });
  const data = await res.json();
  const teams = data.header?.competitions?.[0]?.competitors || [];
  const ids = teams.map((t: { id?: string; team?: { id?: string } }) => String(t.id || t.team?.id || "")).filter(Boolean);
  const names = Object.fromEntries(teams.map((t: { id?: string; team?: { id?: string; displayName?: string } }) => [String(t.id || t.team?.id || ""), t.team?.displayName || ""]));
  const live = await cfbReceivers(ids);
  return NextResponse.json({
    source: live.source,
    players: live.players.map((p) => ({ ...p, team: names[p.teamId] || p.teamId })),
  });
}
