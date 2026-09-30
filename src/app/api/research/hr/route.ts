import { NextResponse } from "next/server";
import { getTodaysGames, getTeamHitters, getPitcherSeasonStats } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export async function GET() {
  const games = await getTodaysGames();
  const cards = [];
  for (const g of games.slice(0, 8)) {
    const [homeHit, awayHit, homeP, awayP] = await Promise.all([
      getTeamHitters(g.homeId),
      getTeamHitters(g.awayId),
      g.homePitcherId ? getPitcherSeasonStats(g.homePitcherId) : Promise.resolve(null),
      g.awayPitcherId ? getPitcherSeasonStats(g.awayPitcherId) : Promise.resolve(null),
    ]);
    const packs = [
      { bats: awayHit, pitcher: homeP, side: g.awayTeam, opp: g.homePitcherName || "home starter" },
      { bats: homeHit, pitcher: awayP, side: g.homeTeam, opp: g.awayPitcherName || "away starter" },
    ];
    for (const pack of packs) {
      const top = [...pack.bats].sort((a, b) => b.hr - a.hr).slice(0, 2);
      for (const b of top) {
        if (b.hr < 8) continue;
        const k9 = pack.pitcher?.k9 ?? 8.5;
        const era = pack.pitcher?.era ?? 4.2;
        const fit = (b.hr / Math.max(b.games, 1)) * 10 + Math.max(0, 9.2 - k9) * 4 + Math.max(0, era - 3.8) * 3;
        const score = Math.round(50 + fit);
        cards.push({
          game: `${g.awayTeam} @ ${g.homeTeam}`,
          pick: `${b.name} HR`,
          score: Math.max(42, Math.min(86, score)),
          why: `${b.name} has ${b.hr} HR in ${b.games} games (${b.avg} AVG, ${b.ops} OPS). Facing ${pack.opp}, K/9 ${k9}, ERA ${era}. Power role plus a starter who misses fewer bats or gives up runs is the reason. Price is not in the score.`,
        });
      }
    }
  }
  cards.sort((a, b) => b.score - a.score);
  return NextResponse.json({ cards: cards.slice(0, 10), note: "Power role vs the listed starter. No odds." });
}
