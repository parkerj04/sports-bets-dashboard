import { grade } from "./confidence";
import type { Edge } from "./mlb";

const BASE = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;
const LG_SPRINT = 27;

export type StealRunner = {
  id: number;
  name: string;
  team: string;
  sb: number;
  cs: number;
  success: number;
  games: number;
  obp: string;
  runs: number;
};

export type CatcherArm = {
  name: string;
  cs: number;
  csPct: number | null;
  games: number;
};

export type SprintRow = {
  id: number;
  ft: number;
  hp: string;
  bolts: number;
  runs: number;
};

export type PitcherHold = {
  name: string;
  sb: number;
  cs: number;
  pk: number;
};

async function json(url: string) {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return null;
  return res.json();
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line.replace(/^\uFEFF/, "")) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === "," && !q) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export async function getSprintMap(): Promise<Map<number, SprintRow>> {
  const url = `https://baseballsavant.mlb.com/leaderboard/sprint_speed?min_season=${SEASON}&max_season=${SEASON}&min=1&csv=true`;
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://baseballsavant.mlb.com/leaderboard/sprint_speed",
    },
  });
  const map = new Map<number, SprintRow>();
  if (!res.ok) return map;
  const text = await res.text();
  const lines = text.split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const id = Number(cols[1]);
    const ft = parseFloat(cols[9]);
    if (!id || Number.isNaN(ft)) continue;
    map.set(id, {
      id,
      ft,
      hp: cols[8] || "—",
      bolts: Number(cols[7]) || 0,
      runs: Number(cols[6]) || 0,
    });
  }
  return map;
}

export async function getPitcherHold(id: number | null, fallbackName: string): Promise<PitcherHold | null> {
  if (!id) return fallbackName ? { name: fallbackName, sb: -1, cs: 0, pk: 0 } : null;
  const data = await json(`${BASE}/people/${id}/stats?stats=season&group=pitching&season=${SEASON}&sportId=1`);
  const s = data?.stats?.[0]?.splits?.[0]?.stat || {};
  const name = data?.stats?.[0]?.splits?.[0]?.player?.fullName || fallbackName;
  return {
    name,
    sb: s.stolenBases ?? 0,
    cs: s.caughtStealing ?? 0,
    pk: s.pickoffs ?? 0,
  };
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
      obp: s.obp || ".000",
      runs: s.runs || 0,
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

function speedBand(ft: number) {
  if (ft >= 30) return "bolt tier (30+)";
  if (ft >= 28.5) return `plus (${(ft - LG_SPRINT).toFixed(1)} over league 27)`;
  if (ft >= 27) return "right at league average";
  return `${(LG_SPRINT - ft).toFixed(1)} under league 27`;
}

function caseAgainst(
  r: StealRunner,
  speed: SprintRow | undefined,
  hold: PitcherHold | null,
  catcher: CatcherArm | null
) {
  if (speed && speed.ft < 26.5) {
    return `Case against: ${speed.ft} ft/s is not a steal-first profile. The ${r.sb} SB may be opportunism, not a prop you can count on tonight.`;
  }
  if (parseFloat(r.obp) > 0 && parseFloat(r.obp) < 0.31) {
    return `Case against: ${r.obp} OBP. No reach, no steal. Speed is wasted if he is making outs.`;
  }
  if (hold && hold.sb >= 0 && hold.sb + hold.cs >= 8 && hold.cs / Math.max(1, hold.sb + hold.cs) >= 0.35) {
    return `Case against: ${hold.name} already has ${hold.cs} CS vs ${hold.sb} SB allowed. Runners are not auto-safe on him.`;
  }
  if (hold && hold.sb >= 0 && hold.sb <= 5 && hold.pk >= 2) {
    return `Case against: ${hold.name} holds the running game (${hold.sb} SB allowed, ${hold.pk} pickoffs).`;
  }
  if (catcher?.csPct != null && catcher.csPct >= 28) {
    return `Case against: ${catcher.name} at ${catcher.csPct}% CS is a plus arm. Do not treat this as a free base.`;
  }
  if (r.cs >= 8) {
    return `Case against: ${r.name} has already been thrown out ${r.cs} times. The jump is not automatic.`;
  }
  if (speed && speed.hp && parseFloat(speed.hp) > 4.35) {
    return `Case against: home-to-first ${speed.hp}s is not a burner first step even if the season SB total looks loud.`;
  }
  return `Case against: ${r.name} still has to be on first against ${hold?.name || "the starter"}. One slide-step and the prop is dead. Tonight's pop time is not in this file.`;
}

export function stealCards(
  runners: StealRunner[],
  hold: PitcherHold | null,
  catcher: CatcherArm | null,
  sprint: Map<number, SprintRow>,
  game: string,
  gamePk?: number
): Edge[] {
  const edges: Edge[] = [];
  const holdReady = hold && hold.sb >= 0;
  for (const r of runners) {
    const speed = sprint.get(r.id);
    const confirms: string[] = [];
    const flags: string[] = [];
    if (r.sb >= 20) confirms.push(`${r.sb} SB`);
    if (r.success >= 78) confirms.push(`${r.success}% success`);
    if (speed && speed.ft >= 28.5) confirms.push(`${speed.ft} ft/s sprint`);
    if (holdReady && hold!.sb >= 12) confirms.push(`${hold!.name} has allowed ${hold!.sb} SB`);
    if (catcher?.csPct != null && catcher.csPct <= 22) confirms.push(`${catcher.name} CS% ${catcher.csPct}`);
    if (speed && speed.ft < 26.5) flags.push(`${speed.ft} ft/s`);
    if (r.success < 70 && r.sb + r.cs >= 10) flags.push(`${r.success}% success`);
    if (catcher?.csPct != null && catcher.csPct >= 30) flags.push(`${catcher.name} CS% ${catcher.csPct}`);
    if (parseFloat(r.obp) > 0 && parseFloat(r.obp) < 0.3) flags.push(`${r.obp} OBP`);
    if (r.sb < 10) flags.push(`only ${r.sb} SB`);
    const gde = grade(confirms, flags);
    const speedLine = speed
      ? `Savant sprint ${speed.ft} ft/s (${speedBand(speed.ft)}), home-to-first ${speed.hp || "n/a"}s, ${speed.bolts} bolts on ${speed.runs} competitive runs.`
      : `No Savant sprint row posted (under the competitive-run cutoff or not tracked).`;
    const holdLine = holdReady
      ? `${hold!.name} hold line: ${hold!.sb} SB allowed, ${hold!.cs} CS, ${hold!.pk} pickoffs.`
      : `${hold?.name || "Starter"} hold line not loaded.`
    const armLine =
      catcher?.csPct != null
        ? `${catcher.name} has thrown out ${catcher.cs} runners at ${catcher.csPct}% CS.`
        : `${catcher?.name || "Opposing catcher"} CS% not posted.`;
    edges.push({
      gamePk,
      game,
      market: "Stolen Bases",
      pick: `${r.name} steals`,
      edgeScore: gde.score,
      pitcher: hold?.name,
      team: r.team,
      reasoning: `${r.name}: ${r.sb} SB / ${r.cs} CS (${r.success}%) in ${r.games} G, ${r.obp} OBP, ${r.runs} runs. ${speedLine} ${holdLine} ${armLine} ${caseAgainst(r, speed, holdReady ? hold : null, catcher)} Score ${gde.score}.`,
      stats: {
        SB: r.sb,
        CS: r.cs,
        "SB%": `${r.success}%`,
        OBP: r.obp,
        "ft/s": speed?.ft ?? "n/a",
        "HP-1B": speed?.hp || "n/a",
        Bolts: speed?.bolts ?? "n/a",
        "P SB-A": holdReady ? hold!.sb : "n/a",
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
  awayPitcherId?: number | null;
  homePitcherId?: number | null;
}): Promise<Edge[]> {
  const [awayRun, homeRun, awayC, homeC, sprint, awayHold, homeHold] = await Promise.all([
    getTeamRunners(opts.awayId, opts.awayTeam),
    getTeamRunners(opts.homeId, opts.homeTeam),
    getTeamCatcher(opts.awayId),
    getTeamCatcher(opts.homeId),
    getSprintMap(),
    getPitcherHold(opts.homePitcherId ?? null, opts.homePitcher || "home starter"),
    getPitcherHold(opts.awayPitcherId ?? null, opts.awayPitcher || "away starter"),
  ]);
  return [
    ...stealCards(awayRun, awayHold, homeC, sprint, opts.game, opts.gamePk),
    ...stealCards(homeRun, homeHold, awayC, sprint, opts.game, opts.gamePk),
  ].sort((a, b) => b.edgeScore - a.edgeScore);
}
