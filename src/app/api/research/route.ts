import { NextResponse } from "next/server";
import { findTodaysEdges, getPitcherSeasonStats, getTeamKPct, getTodaysGames } from "@/lib/mlb";
import { alwaysCard } from "@/lib/game-card";
import { getMlbLines, matchLine } from "@/lib/mlb-odds";
import { dedupeEdges } from "@/lib/edges";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  try {
    const [games, edges, lines] = await Promise.all([
      getTodaysGames(date),
      findTodaysEdges(date),
      getMlbLines(),
    ]);
    const extras = [];
    for (const g of games) {
      const [homeP, awayP, homeT, awayT] = await Promise.all([
        g.homePitcherId ? getPitcherSeasonStats(g.homePitcherId) : Promise.resolve(null),
        g.awayPitcherId ? getPitcherSeasonStats(g.awayPitcherId) : Promise.resolve(null),
        getTeamKPct(g.homeId),
        getTeamKPct(g.awayId),
      ]);
      extras.push(...(await alwaysCard(g, homeP, awayP, homeT, awayT)));
    }
    const noDupK = edges.filter((e) => e.market !== "Pitcher Ks");
    const all = dedupeEdges([...extras, ...noDupK]);
    const slate = games.map((g) => ({
      ...g,
      line: matchLine(lines, g.awayTeam, g.homeTeam) || null,
    }));
    return NextResponse.json({ edges: all, games: slate, date: date || "today" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch research data", edges: [], games: [] }, { status: 500 });
  }
}
