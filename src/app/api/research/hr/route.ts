import { NextResponse } from "next/server";
import { getTodaysGames, getTeamHitters, getPitcherSeasonStats } from "@/lib/mlb";

export const dynamic = "force-dynamic";

const HR_PARKS = ["Great American", "Coors", "Yankee", "Camden", "Citizens Bank", "Globe Life", "Wrigley"];

export async function GET() {
  const games = await getTodaysGames();
  const cards = [];
  for (const g of games.slice(0, 10)) {
    const [homeHit, awayHit, homeP, awayP] = await Promise.all([
      getTeamHitters(g.homeId),
      getTeamHitters(g.awayId),
      g.homePitcherId ? getPitcherSeasonStats(g.homePitcherId) : Promise.resolve(null),
      g.awayPitcherId ? getPitcherSeasonStats(g.awayPitcherId) : Promise.resolve(null),
    ]);
    const packs = [
      { bats: awayHit, pitcher: homeP, opp: g.homePitcher || "home starter" },
      { bats: homeHit, pitcher: awayP, opp: g.awayPitcher || "away starter" },
    ];
    for (const pack of packs) {
      const top = [...pack.bats].sort((a, b) => b.hr - a.hr).slice(0, 2);
      for (const b of top) {
        if (b.hr < 8) continue;
        const p = pack.pitcher;
        const k9 = p?.k9 ?? 8.5;
        const era = p?.era ?? 4.2;
        const hr9 = p?.hr9 ?? 1.1;
        const whip = p?.whip ?? 1.25;
        const hand = p?.hand || "?";
        const fb = (p?.arsenal || []).find((x) => /four-seam|fastball|sinker/i.test(x.name));
        const hrPerGame = Math.round((b.hr / Math.max(b.games, 1)) * 100) / 100;
        const isoProxy = b.hits ? Math.round((b.hr / b.hits) * 100) : 0;
        const park = HR_PARKS.find((n) => (g.venue || "").includes(n));
        let score = 48;
        const bits: string[] = [];
        score += Math.min(16, hrPerGame * 40);
        bits.push(`${b.name} (${b.position}) has ${b.hr} HR in ${b.games} games, ${hrPerGame} per game, ${b.ops} OPS, ${b.rbi} RBI. Home runs are ${isoProxy}% of his hits, so this is power, not a singles bat.`);
        if (hr9 >= 1.3) { score += 8; bits.push(`${pack.opp} (${hand}HP) allows ${hr9} HR/9 with a ${era} ERA and ${whip} WHIP. That is a fly-ball leak.`); }
        else bits.push(`${pack.opp} (${hand}HP) allows ${hr9} HR/9, K/9 ${k9}, ERA ${era}. The bat is the case. The starter is not giving them away.`);
        if (k9 < 8) { score += 4; bits.push(`He misses fewer bats than a league starter (${k9} K/9), so the ball is in play.`); }
        if (fb && fb.pct >= 40) { score += 3; bits.push(`Arsenal is ${fb.name} ${fb.pct}% at ${fb.avgVelo} mph. Fastball-heavy mixes are what power bats hunt.`); }
        if (park) { score += 4; bits.push(`${g.venue} is a known home-run park.`); }
        else bits.push(`Park is ${g.venue || "the listed stadium"}. Not treating it as a boost.`);
        bits.push(score >= 68 ? "Playable if the price is plus money. Pass if it is juiced." : "Research lean only. Power is real. Pitcher or park does not add enough.");
        cards.push({ game: `${g.awayTeam} @ ${g.homeTeam}`, pick: `${b.name} HR`, score: Math.max(42, Math.min(88, Math.round(score))), why: bits.join(" ") });
      }
    }
  }
  cards.sort((a, b) => b.score - a.score);
  return NextResponse.json({ cards: cards.slice(0, 8), note: "Power rate, pitcher HR/9, arsenal, and park. No odds in the score." });
}
