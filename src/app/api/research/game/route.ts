import { NextResponse } from "next/server";
import {
  edgesForGame,
  getGameBrief,
  getPitcherSeasonStats,
  getTeamHitters,
  getTeamKPct,
} from "@/lib/mlb";
import { getZones } from "@/lib/zones";

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

    const [homeZones, awayZones, homeBatZones, awayBatZones] = await Promise.all([
      game.homePitcherId ? getZones(game.homePitcherId, "pitching") : Promise.resolve(null),
      game.awayPitcherId ? getZones(game.awayPitcherId, "pitching") : Promise.resolve(null),
      homeHit[0]?.id ? getZones(homeHit[0].id, "hitting") : Promise.resolve(null),
      awayHit[0]?.id ? getZones(awayHit[0].id, "hitting") : Promise.resolve(null),
    ]);

    return NextResponse.json({
      game,
      homePitcher: homeP,
      awayPitcher: awayP,
      homeHitters: homeHit,
      awayHitters: awayHit,
      homeTeam,
      awayTeam,
      edges,
      homeZones,
      awayZones,
      homeBatZones,
      awayBatZones,
      homeBatName: homeHit[0]?.name,
      awayBatName: awayHit[0]?.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load game" }, { status: 500 });
  }
}
