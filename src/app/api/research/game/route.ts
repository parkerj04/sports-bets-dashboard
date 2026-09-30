import { NextResponse } from "next/server";
import {
  edgesForGame,
  getGameBrief,
  getPitcherSeasonStats,
  getTeamHitters,
  getTeamKPct,
  type BatterLine,
} from "@/lib/mlb";
import { gameMarketEdges } from "@/lib/mlb-markets";
import { alwaysCard } from "@/lib/game-card";
import { stealDesk } from "@/lib/sb";
import { getBvP, getPitcherLogs, getPitcherSplits, lsPitcherRating, projectKs } from "@/lib/propdesk";
import { getHitterLogs } from "@/lib/hitter-form";
import { getLineups, type LineupBat } from "@/lib/lineups";
import { dedupeEdges } from "@/lib/edges";
import { getMlbLines, matchLine } from "@/lib/mlb-odds";
import { mlbTicket } from "@/lib/mlb-context";
import { stampEdges } from "@/lib/ticket";

export const dynamic = "force-dynamic";

function mergeLineup(lineup: LineupBat[], season: BatterLine[]): BatterLine[] {
  if (!lineup.length) return season;
  return lineup.map((l) => {
    const s = season.find((h) => h.id === l.id);
    return (
      s || {
        id: l.id,
        name: `${l.slot}. ${l.name}`,
        position: l.pos,
        avg: "—",
        ops: "—",
        hr: 0,
        hits: 0,
        so: 0,
        rbi: 0,
        games: 0,
      }
    );
  }).map((b, i) => ({
    ...b,
    name: lineup[i] ? `${lineup[i].slot}. ${lineup[i].name}` : b.name,
    position: lineup[i]?.pos || b.position,
  }));
}

export async function GET(request: Request) {
  const gamePk = Number(new URL(request.url).searchParams.get("gamePk"));
  if (!gamePk) return NextResponse.json({ error: "Missing gamePk" }, { status: 400 });

  try {
    const game = await getGameBrief(gamePk);
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const [homeP, awayP, homeHit, awayHit, homeTeam, awayTeam, edges, lineups, steals, lines] = await Promise.all([
      game.homePitcherId ? getPitcherSeasonStats(game.homePitcherId) : Promise.resolve(null),
      game.awayPitcherId ? getPitcherSeasonStats(game.awayPitcherId) : Promise.resolve(null),
      getTeamHitters(game.homeId),
      getTeamHitters(game.awayId),
      getTeamKPct(game.homeId),
      getTeamKPct(game.awayId),
      edgesForGame(game),
      getLineups(gamePk),
      stealDesk({
        gamePk: game.gamePk,
        game: `${game.awayTeam} @ ${game.homeTeam}`,
        awayId: game.awayId,
        homeId: game.homeId,
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        awayPitcher: game.awayPitcher,
        homePitcher: game.homePitcher,
        awayPitcherId: game.awayPitcherId,
        homePitcherId: game.homePitcherId,
      }),
      getMlbLines(),
    ]);

    const homeLive = mergeLineup(lineups.home, homeHit);
    const awayLive = mergeLineup(lineups.away, awayHit);
    const line = matchLine(lines, game.awayTeam, game.homeTeam);
    const ticket = await mlbTicket({
      gamePk: game.gamePk,
      game: `${game.awayTeam} @ ${game.homeTeam}`,
      venueName: game.venue,
      lineupPosted: lineups.posted,
      homeId: game.homeId,
      awayId: game.awayId,
      line,
    });

    const card = await alwaysCard(game, homeP, awayP, homeTeam, awayTeam);
    const markets = gameMarketEdges(game, homeP, awayP, homeTeam, awayTeam);
    let all = dedupeEdges([...card, ...markets, ...edges.filter((e) => e.market !== "Pitcher Ks"), ...steals]);
    all = stampEdges(all, ticket);
    const stealCards = stampEdges(steals, ticket);

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

    const pickHome = homeLive.length ? homeLive : homeHit;
    const pickAway = awayLive.length ? awayLive : awayHit;

    const bvp = [];
    if (game.awayPitcherId) {
      for (const b of pickHome.slice(0, 9)) bvp.push(await getBvP(b.id, game.awayPitcherId, b.name));
    }
    if (game.homePitcherId) {
      for (const b of pickAway.slice(0, 9)) bvp.push(await getBvP(b.id, game.homePitcherId, b.name));
    }

    const form = [];
    for (const b of [...pickAway.slice(0, 9), ...pickHome.slice(0, 9)]) {
      form.push(await getHitterLogs(b.id, b.name));
    }

    for (const e of all) {
      if (e.market === "Batter Hits") {
        const f = form.find((x) => e.pick.includes(x.name.replace(/^\d+\.\s*/, "")) || x.name.includes(e.pick.split(" ")[0]));
        if (f) {
          const gamesWithHit = f.games.filter((g) => g.h >= 1).length;
          e.stats = {
            ...e.stats,
            "L5 hit rate": `${gamesWithHit}/${f.games.length || 5} games with a hit · ${f.l5h}-for-${f.l5ab}`,
          };
        }
      }
    }
    all.sort((a, b) => b.edgeScore - a.edgeScore);

    return NextResponse.json({
      game,
      homePitcher: homeP,
      awayPitcher: awayP,
      homeHitters: pickHome,
      awayHitters: pickAway,
      lineupPosted: lineups.posted,
      homeTeam,
      awayTeam,
      edges: all,
      steals: stealCards,
      ticket,
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
