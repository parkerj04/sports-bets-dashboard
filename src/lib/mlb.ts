const BASE = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

import { grade } from "./confidence";

export interface GameMatchup {
  gamePk: number;
  awayTeam: string;
  homeTeam: string;
  awayAbbr?: string;
  homeAbbr?: string;
  awayId: number;
  homeId: number;
  awayPitcher: string | null;
  homePitcher: string | null;
  awayPitcherId: number | null;
  homePitcherId: number | null;
  venue: string;
  status: string;
  gameDate?: string;
}

export interface PitchMix {
  code: string;
  name: string;
  pct: number;
  count: number;
  avgVelo: number;
}

export interface PitcherStats {
  id: number;
  name: string;
  hand: string;
  strikeOuts: number;
  inningsPitched: number;
  k9: number;
  era: number;
  whip: number;
  gamesStarted: number;
  wins: number;
  losses: number;
  hr9: number;
  avgAgainst: number;
  arsenal: PitchMix[];
}

export interface BatterLine {
  id: number;
  name: string;
  position: string;
  avg: string;
  ops: string;
  hr: number;
  hits: number;
  so: number;
  rbi: number;
  games: number;
}

export interface TeamKStats {
  teamId: number;
  name: string;
  strikeOuts: number;
  plateAppearances: number;
  kPct: number;
  avg: string;
  ops: string;
  runs: number;
}

export interface Edge {
  gamePk?: number;
  game: string;
  market: string;
  pick: string;
  edgeScore: number;
  reasoning: string;
  stats: Record<string, string | number>;
  pitcher?: string;
  team?: string;
}

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function getTodaysGames(date?: string): Promise<GameMatchup[]> {
  const d = date || todayISO();
  const url = `${BASE}/schedule?sportId=1&date=${d}&hydrate=probablePitcher,team,venue`;
  const res = await fetch(url, { next: { revalidate: 180 } });
  if (!res.ok) return [];
  const data = await res.json();
  const games: GameMatchup[] = [];
  for (const day of data.dates || []) {
    for (const g of day.games || []) {
      const away = g.teams?.away;
      const home = g.teams?.home;
      const abstract = g.status?.abstractGameState || "";
      if (abstract === "Final") continue;
      games.push({
        gamePk: g.gamePk,
        awayTeam: away?.team?.name || "Away",
        homeTeam: home?.team?.name || "Home",
        awayAbbr: away?.team?.abbreviation,
        homeAbbr: home?.team?.abbreviation,
        awayId: away?.team?.id,
        homeId: home?.team?.id,
        awayPitcher: away?.probablePitcher?.fullName || null,
        homePitcher: home?.probablePitcher?.fullName || null,
        awayPitcherId: away?.probablePitcher?.id || null,
        homePitcherId: home?.probablePitcher?.id || null,
        venue: g.venue?.name || "",
        status: g.status?.detailedState || "",
        gameDate: g.gameDate,
      });
    }
  }
  return games;
}

export async function getPitcherSeasonStats(playerId: number, season = SEASON): Promise<PitcherStats | null> {
  const [statsRes, bioRes, mixRes] = await Promise.all([
    fetch(`${BASE}/people/${playerId}/stats?stats=season&group=pitching&season=${season}&sportId=1`, { next: { revalidate: 1800 } }),
    fetch(`${BASE}/people/${playerId}`, { next: { revalidate: 86400 } }),
    fetch(`${BASE}/people/${playerId}/stats?stats=pitchArsenal&group=pitching&season=${season}`, { next: { revalidate: 1800 } }),
  ]);
  if (!statsRes.ok) return null;
  const data = await statsRes.json();
  const split = data.stats?.[0]?.splits?.[0];
  if (!split) return null;
  const s = split.stat;
  const ip = parseFloat(s.inningsPitched || "0");
  const so = s.strikeOuts || 0;
  let name = split.player?.fullName || "";
  let hand = "?";
  if (bioRes.ok) {
    const bio = await bioRes.json();
    const p = bio.people?.[0];
    name = p?.fullName || name;
    hand = p?.pitchHand?.code || "?";
  }
  const arsenal: PitchMix[] = [];
  if (mixRes.ok) {
    const mix = await mixRes.json();
    for (const row of mix.stats?.[0]?.splits || []) {
      const st = row.stat || {};
      arsenal.push({
        code: st.type?.code || "",
        name: st.type?.description || "Pitch",
        pct: Math.round((st.percentage || 0) * 1000) / 10,
        count: st.count || 0,
        avgVelo: Math.round((st.averageSpeed || 0) * 10) / 10,
      });
    }
    arsenal.sort((a, b) => b.pct - a.pct);
  }
  return {
    id: playerId, name, hand, strikeOuts: so, inningsPitched: ip,
    k9: ip > 0 ? Math.round((so / ip) * 9 * 100) / 100 : 0,
    era: parseFloat(s.era || "0"), whip: parseFloat(s.whip || "0"),
    gamesStarted: s.gamesStarted || 0, wins: s.wins || 0, losses: s.losses || 0,
    hr9: parseFloat(s.homeRunsPer9 || "0"), avgAgainst: parseFloat(s.avg || "0"), arsenal,
  };
}

export async function getTeamKPct(teamId: number, season = SEASON): Promise<TeamKStats | null> {
  const res = await fetch(`${BASE}/teams/${teamId}/stats?stats=season&group=hitting&season=${season}&sportIds=1`, { next: { revalidate: 1800 } });
  if (!res.ok) return null;
  const data = await res.json();
  const split = data.stats?.[0]?.splits?.[0];
  if (!split) return null;
  const s = split.stat;
  const so = s.strikeOuts || 0;
  const pa = s.plateAppearances || s.atBats || 1;
  return { teamId, name: split.team?.name || "", strikeOuts: so, plateAppearances: pa, kPct: Math.round((so / pa) * 1000) / 10, avg: s.avg || ".000", ops: s.ops || ".000", runs: s.runs || 0 };
}

export async function getTeamHitters(teamId: number, season = SEASON): Promise<BatterLine[]> {
  const res = await fetch(`${BASE}/stats?stats=season&group=hitting&season=${season}&sportIds=1&teamId=${teamId}&playerPool=all&limit=40&sortStat=atBats`, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const data = await res.json();
  const batters: BatterLine[] = [];
  for (const row of data.stats?.[0]?.splits || []) {
    const s = row.stat || {};
    if ((s.atBats || 0) < 80) continue;
    batters.push({ id: row.player?.id, name: row.player?.fullName || "", position: row.position?.abbreviation || "", avg: s.avg || ".000", ops: s.ops || ".000", hr: s.homeRuns || 0, hits: s.hits || 0, so: s.strikeOuts || 0, rbi: s.rbi || 0, games: s.gamesPlayed || 0 });
  }
  batters.sort((a, b) => parseFloat(b.ops) - parseFloat(a.ops));
  return batters.slice(0, 12);
}

export async function edgesForGame(g: GameMatchup): Promise<Edge[]> {
  const edges: Edge[] = [];
  const game = `${g.awayTeam} @ ${g.homeTeam}`;
  const sides = [
    { pitcherId: g.homePitcherId, pitcherName: g.homePitcher, oppId: g.awayId, opp: g.awayTeam },
    { pitcherId: g.awayPitcherId, pitcherName: g.awayPitcher, oppId: g.homeId, opp: g.homeTeam },
  ];
  for (const m of sides) {
    if (!m.pitcherId || !m.pitcherName) continue;
    const [p, t, bats] = await Promise.all([getPitcherSeasonStats(m.pitcherId), getTeamKPct(m.oppId), getTeamHitters(m.oppId)]);
    if (!p || p.inningsPitched < 15) continue;
    if (t) {
      const confirms: string[] = [];
      const flags: string[] = [];
      if (p.k9 >= 9.5) confirms.push(`${p.k9} K/9`);
      if (t.kPct >= 23.5) confirms.push(`opp K% ${t.kPct}`);
      if (p.avgAgainst > 0 && p.avgAgainst <= 0.21) confirms.push(`AVG against ${p.avgAgainst.toFixed(3)}`);
      if (p.whip > 0 && p.whip <= 1.15) confirms.push(`WHIP ${p.whip}`);
      if (p.era > 0 && p.era <= 3.2) confirms.push(`ERA ${p.era}`);
      if (p.avgAgainst >= 0.23) flags.push(`AVG against ${p.avgAgainst.toFixed(3)}`);
      if (p.whip >= 1.28) flags.push(`WHIP ${p.whip}`);
      if (parseFloat(t.avg) >= 0.25) flags.push(`opp season AVG ${t.avg}`);
      const gde = grade(confirms, flags);
      edges.push({
        gamePk: g.gamePk, game, market: "Pitcher Ks", pick: `${p.name} (${p.hand}HP) strikeouts`,
        edgeScore: gde.score,
        reasoning: `${p.name} ${p.wins}-${p.losses}, ${p.k9} K/9, ${p.era} ERA. ${m.opp} K% ${t.kPct}, AVG ${t.avg}. ${gde.why}`,
        stats: { "K/9": p.k9, ERA: p.era, WHIP: p.whip, "Opp K%": `${t.kPct}%`, "Opp AVG": t.avg },
        pitcher: p.name, team: m.opp,
      });
      if (p.era <= 3.6 && t.kPct >= 21 && flags.length === 0) {
        const under = grade(
          [p.era <= 3.2 ? `ERA ${p.era}` : "", t.kPct >= 23.5 ? `opp K% ${t.kPct}` : "", p.avgAgainst <= 0.21 ? `AVG against ${p.avgAgainst.toFixed(3)}` : ""].filter(Boolean),
          []
        );
        edges.push({
          gamePk: g.gamePk, game, market: "Team Hits Under", pick: `${m.opp} under team hits`,
          edgeScore: under.score,
          reasoning: `${p.name} AVG against ${p.avgAgainst.toFixed(3)}. ${under.why}`,
          stats: { ERA: p.era, "AVG against": p.avgAgainst.toFixed(3), "Opp K%": `${t.kPct}%` },
          pitcher: p.name, team: m.opp,
        });
      }
      if (p.whip >= 1.28 || p.era >= 4.2) {
        const over = grade(
          [p.whip >= 1.35 ? `WHIP ${p.whip}` : "", p.era >= 4.5 ? `ERA ${p.era}` : "", parseFloat(t.ops) >= 0.74 ? `opp OPS ${t.ops}` : ""].filter(Boolean),
          []
        );
        edges.push({
          gamePk: g.gamePk, game, market: "Team Hits Over", pick: `${m.opp} over team hits`,
          edgeScore: over.score,
          reasoning: `${p.name} ${p.whip} WHIP / ${p.era} ERA vs ${m.opp}. ${over.why}`,
          stats: { WHIP: p.whip, ERA: p.era, "Opp AVG": t.avg, "Opp OPS": t.ops },
          pitcher: p.name, team: m.opp,
        });
      }
    }
    const top = bats.filter((b) => parseFloat(b.avg) >= 0.26 || parseFloat(b.ops) >= 0.78).slice(0, 3);
    for (const b of top) {
      const confirms = [
        parseFloat(b.avg) >= 0.28 ? `${b.name} ${b.avg} AVG` : "",
        parseFloat(b.ops) >= 0.85 ? `${b.ops} OPS` : "",
        p.whip >= 1.3 ? `pitcher WHIP ${p.whip}` : "",
      ].filter(Boolean);
      const flags = [parseFloat(b.avg) < 0.24 ? "batter AVG under .240" : ""].filter(Boolean);
      const hit = grade(confirms, flags);
      if (hit.score < 50 || confirms.length === 0) continue;
      edges.push({
        gamePk: g.gamePk, game, market: "Batter Hits", pick: `${b.name} hits`,
        edgeScore: hit.score,
        reasoning: `${b.name} ${b.avg}/${b.ops} vs ${p.name} (${p.whip} WHIP). ${hit.why}`,
        stats: { AVG: b.avg, OPS: b.ops, HR: b.hr, "P WHIP": p.whip, "P hand": `${p.hand}HP` },
        pitcher: p.name, team: m.opp,
      });
    }
  }
  edges.sort((a, b) => b.edgeScore - a.edgeScore);
  return edges;
}

export async function findTodaysEdges(date?: string): Promise<Edge[]> {
  const games = await getTodaysGames(date);
  const all: Edge[] = [];
  for (const g of games) all.push(...(await edgesForGame(g)));
  all.sort((a, b) => b.edgeScore - a.edgeScore);
  return all;
}

export async function getGameBrief(gamePk: number): Promise<GameMatchup | null> {
  const res = await fetch(`${BASE}/schedule?sportId=1&gamePk=${gamePk}&hydrate=probablePitcher,team,venue`, { next: { revalidate: 180 } });
  if (!res.ok) return null;
  const data = await res.json();
  const g = data.dates?.[0]?.games?.[0];
  if (!g) return null;
  const away = g.teams?.away;
  const home = g.teams?.home;
  return { gamePk: g.gamePk, awayTeam: away?.team?.name || "Away", homeTeam: home?.team?.name || "Home", awayAbbr: away?.team?.abbreviation, homeAbbr: home?.team?.abbreviation, awayId: away?.team?.id, homeId: home?.team?.id, awayPitcher: away?.probablePitcher?.fullName || null, homePitcher: home?.probablePitcher?.fullName || null, awayPitcherId: away?.probablePitcher?.id || null, homePitcherId: home?.probablePitcher?.id || null, venue: g.venue?.name || "", status: g.status?.detailedState || "", gameDate: g.gameDate };
}
