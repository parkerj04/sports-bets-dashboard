import { NextResponse } from "next/server";
import {
  edgesForGame,
  getGameBrief,
  getPitcherSeasonStats,
  getTeamHitters,
  getTeamKPct,
} from "@/lib/mlb";
import { gameMarketEdges } from "@/lib/mlb-markets";
import { alwaysCard } from "@/lib/game-card";
import { getBvP, getPitcherLogs, getPitcherSplits, lsPitcherRating, projectKs } from "@/lib/propdesk";
import { getHitterLogs } from "@/lib/hitter-form";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gamePk = Number(new URL(request.url).searchParams.get("gamePk"));
  if (!gamePk) return NextResponse.json({ error: "Missing gamePk" }, { status: 400 });

  try {
    const game = await getGameBrief(gamePk);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const [homeP, awayP, homeHit, awayHit, homeTeam, awayTeam, edges] = await Promise.all([
      game.homePitcherId ? getPitcherSeasonStats(game.homePitcherId) : Promise.resolve(null),
      game.awayPitcherId ? getPitcherSeasonStats(game.awayPitcherId) : Promise.resolve(null),
      getTeamHitters(game.homeId),
      getTeamHitters(game.awayId),
      getTeamKPct(game.homeId),
      getTeamKPct(game.awayId),
      edgesForGame(game),
    ]);

    const card = alwaysCard(game, homeP, awayP, homeTeam, awayTeam);
    const markets = gameMarketEdges(game, homeP, awayP, homeTeam, awayTeam);
    const all = [...card, ...markets, ...edges].sort((a, b) => b.edgeScore - a.edgeScore);

    const [homeLogs, awayLogs, homeSplits, awaySplits] = await Promise.all([
      game.homePitcherId ? getPitcherLogs(game.homePitcherId) : Promise.resolve([]),
      game.awayPitcherId ? getPitcherLogs(game.awayPitcherId) : Promise.resolve([]),
      game.homePitcherId ? getPitcherSplits(game.homePitcherId) : Promise.resolve([]),
      game.awayPitcherId ? getPitcherSplits(game.awayPitcherId) : Promise.resolve([]),
    ]);

    async function desk(p: typeof homeP, logs: Awaited<ReturnType<typeof getPitcherLogs>>, splits: Awaited<ReturnType<typeof getPitcherSplits>>, oppK: number) {
      if (!p) return null;
      const last5K = logs.reduce((s, g) => s + g.k, 0);
      const last5IP = logs.reduce((s, g) => s + parseFloat(g.ip || "0"), 0);
      return {
        last5: logs,
        last5K,
        last5IP: Math.round(last5IP * 10) / 10,
        projK: projectKs(p.k9, oppK),
        lsRating: lsPitcherRating(p.k9, oppK, p.era, last5K),
        splits,
      };
    }

    const homeDeep = await desk(homeP, homeLogs, homeSplits, awayTeam?.kPct || 22);
    const awayDeep = await desk(awayP, awayLogs, awaySplits, homeTeam?.kPct || 22);

    const bvp = [];
    if (game.awayPitcherId) {
      for (const b of homeHit.slice(0, 8)) bvp.push(await getBvP(b.id, game.awayPitcherId, b.name));
    }
    if (game.homePitcherId) {
      for (const b of awayHit.slice(0, 8)) bvp.push(await getBvP(b.id, game.homePitcherId, b.name));
    }

    const form = [];
    for (const b of [...awayHit.slice(0, 6), ...homeHit.slice(0, 6)]) {
      form.push(await getHitterLogs(b.id, b.name));
    }

    return NextResponse.json({
      game,
      homePitcher: homeP,
      awayPitcher: awayP,
      homeHitters: homeHit,
      awayHitters: awayHit,
      homeTeam,
      awayTeam,
      edges: all,
      homeDeep,
      awayDeep,
      bvp: bvp.filter(Boolean),
      form,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}
