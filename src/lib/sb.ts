import { grade } from "./confidence";
import type { Edge } from "./mlb";

const BASE = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

export type StealRunner = {
  id: number;
  name: string;
  team: string;
  sb: number;
  cs: number;
  success: number;
  games: number;
};

export type CatcherArm = {
  name: string;
  cs: number;
  csPct: number | null;
  games: number;
};

async function json(url: string) {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getTeamRunners(teamId: number, teamName: string): Promise<StealRunner[]> {
  const data = await json(
    `${BASE}/stats?stats=season&group=hitting&season=${SEASON}&sportIds=1&teamId=${teamId}&playerPool=all&limit=40&sortStat=stolenBases`
  );
  const out: StealRunner[] = [];
  for (const row of data?.stats?.[0]?.splits || []) {
    const s = row.stat || {};
    const sb = s.stolenBases || 0;
    const cs = s.caughtStealing || 0;
    if (sb + cs < 6 && sb < 8) continue;
    out.push({
      id: row.player?.id,
      name: row.player?.fullName || "",
      team: teamName,
      sb,
      cs,
      success: sb + cs > 0 ? Math.round((sb / (sb + cs)) * 1000) / 10 : 0,
      games: s.gamesPlayed || 0,
    });
  }
  out.sort((a, b) => b.sb - a.sb || b.success - a.success);
  return out.slice(0, 8);
}

export async function getTeamCatcher(teamId: number): Promise<CatcherArm | null> {
  const data = await json(
    `${BASE}/stats?stats=season&group=fielding&season=${SEASON}&sportIds=1&teamId=${teamId}&position=C&limit=8`
  );
  const rows = data?.stats?.[0]?.splits || [];
  let best: CatcherArm | null = null;
  for (const row of rows) {
    const s = row.stat || {};
    const cs = s.caughtStealing || 0;
    const raw = s.caughtStealingPercentage;
    const csPct = raw != null && raw !== "" ? parseFloat(String(raw).replace("%", "")) : null;
    const games = s.gamesPlayed || s.games || 0;
    const arm: CatcherArm = {
      name: row.player?.fullName || "team catcher",
      cs,
      csPct: csPct != null && csPct <= 1 ? Math.round(csPct * 1000) / 10 : csPct,
      games,
    };
    if (!best || games > best.games || cs > best.cs) best = arm;
  }
  return best;
}

export function stealCards(
  runners: StealRunner[],
  vsPitcher: string,
  catcher: CatcherArm | null,
  game: string,
  gamePk?: number
): Edge[] {
  const edges: Edge[] = [];
  for (const r of runners) {
    const confirms: string[] = [];
    const flags: string[] = [];
    if (r.sb >= 20) confirms.push(`${r.sb} SB`);
    if (r.sb >= 12 && r.sb < 20) confirms.push(`${r.sb} SB (volume)`);
    if (r.success >= 78) confirms.push(`${r.success}% success`);
    if (catcher?.csPct != null && catcher.csPct <= 22) confirms.push(`${catcher.name} CS% ${catcher.csPct} is below average`);
    if (r.success < 70 && r.sb + r.cs >= 10) flags.push(`success only ${r.success}% (${r.sb}/${r.cs} CS)`);
    if (catcher?.csPct != null && catcher.csPct >= 30) flags.push(`${catcher.name} throws out ${catcher.csPct}%`);
    if (r.sb < 10) flags.push(`only ${r.sb} steals — small sample to bet a stolen-base prop`);
    const gde = grade(confirms, flags);
    const against =
      flags.length > 0
        ? `Case against: ${flags.join("; ")}.`
        : `Case against: he still has to reach base, and one pitchout or slide-step from ${vsPitcher || "the starter"} kills the attempt. Catcher sample is regular-season fielding, not tonight's pop time.`;
    edges.push({
      gamePk,
      game,
      market: "Stolen Bases",
      pick: `${r.name} steals`,
      edgeScore: gde.score,
      pitcher: vsPitcher,
      team: r.team,
      reasoning: `${r.name} (${r.team}) ${r.sb} SB / ${r.cs} CS, ${r.success}% success in ${r.games} games. Running on ${vsPitcher || "TBD starter"}. Opposing catcher ${catcher?.name || "unlisted"}${catcher?.csPct != null ? ` CS% ${catcher.csPct}` : " (no CS% loaded)"}${catcher ? `, ${catcher.cs} CS recorded` : ""}. ${against} Score ${gde.score}.`,
      stats: {
        SB: r.sb,
        CS: r.cs,
        "SB%": `${r.success}%`,
        Catcher: catcher?.name || "—",
        "C CS%": catcher?.csPct ?? "—",
      },
    });
  }
  return edges.sort((a, b) => b.edgeScore - a.edgeScore).slice(0, 6);
}

export async function stealDesk(opts: {
  gamePk: number;
  game: string;
  awayId: number;
  homeId: number;
  awayTeam: string;
  homeTeam: string;
  awayPitcher: string | null;
  homePitcher: string | null;
}): Promise<Edge[]> {
  const [awayRun, homeRun, awayC, homeC] = await Promise.all([
    getTeamRunners(opts.awayId, opts.awayTeam),
    getTeamRunners(opts.homeId, opts.homeTeam),
    getTeamCatcher(opts.awayId),
    getTeamCatcher(opts.homeId),
  ]);
  return [
    ...stealCards(awayRun, opts.homePitcher || "home starter", homeC, opts.game, opts.gamePk),
    ...stealCards(homeRun, opts.awayPitcher || "away starter", awayC, opts.game, opts.gamePk),
  ].sort((a, b) => b.edgeScore - a.edgeScore);
}
