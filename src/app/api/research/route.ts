import { NextResponse } from "next/server";
import { findTodaysEdges, getPitcherSeasonStats, getTeamKPct, getTodaysGames } from "@/lib/mlb";
import { gameMarketEdges } from "@/lib/mlb-markets";
import { getMlbLines, matchLine } from "@/lib/mlb-odds";

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
      extras.push(...gameMarketEdges(g, homeP, awayP, homeT, awayT));
    }
    const all = [...extras, ...edges].sort((a, b) => b.edgeScore - a.edgeScore);
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
