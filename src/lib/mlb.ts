const BASE = "https://statsapi.mlb.com/api/v1";
const SEASON = 2026;

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
      const k9Score = Math.min(100, Math.max(0, ((p.k9 - 7.0) / 7) * 100));
      const kPctScore = Math.min(100, Math.max(0, ((t.kPct - 17) / 14) * 100));
      const kScore = Math.round(k9Score * 0.55 + kPctScore * 0.45);
      edges.push({ gamePk: g.gamePk, game, market: "Pitcher Ks", pick: `${p.name} (${p.hand}HP) strikeouts`, edgeScore: Math.max(kScore, 28), reasoning: `${p.name} is ${p.wins}-${p.losses} with a ${p.k9} K/9 and ${p.era} ERA. ${m.opp} K rate is ${t.kPct}% (league ~22%).`, stats: { "K/9": p.k9, ERA: p.era, WHIP: p.whip, "Opp K%": `${t.kPct}%`, "Opp AVG": t.avg }, pitcher: p.name, team: m.opp });
      if (p.era <= 3.6 && t.kPct >= 21) {
        edges.push({ gamePk: g.gamePk, game, market: "Team Hits Under", pick: `${m.opp} under team hits`, edgeScore: Math.min(92, Math.round(40 + (3.6 - p.era) * 12 + (t.kPct - 21) * 2)), reasoning: `${p.name} holds opponents to a ${p.avgAgainst.toFixed(3)} AVG (${p.era} ERA, ${p.hr9} HR/9). ${m.opp} punch out ${t.kPct}% of the time.`, stats: { ERA: p.era, "AVG against": p.avgAgainst.toFixed(3), "Opp K%": `${t.kPct}%` }, pitcher: p.name, team: m.opp });
      }
      if (p.whip >= 1.28 || p.era >= 4.2) {
        edges.push({ gamePk: g.gamePk, game, market: "Team Hits Over", pick: `${m.opp} over team hits`, edgeScore: Math.min(88, Math.round(35 + (p.whip - 1.2) * 40 + Math.max(0, p.era - 4) * 8)), reasoning: `${p.name} has a ${p.whip} WHIP and ${p.era} ERA vs ${m.opp} (${t.avg} AVG, ${t.ops} OPS).`, stats: { WHIP: p.whip, ERA: p.era, "Opp AVG": t.avg, "Opp OPS": t.ops }, pitcher: p.name, team: m.opp });
      }
    }
    const top = bats.filter((b) => parseFloat(b.avg) >= 0.26 || parseFloat(b.ops) >= 0.78).slice(0, 3);
    for (const b of top) {
      const hitScore = Math.min(90, Math.round(30 + parseFloat(b.avg) * 80 + Math.max(0, parseFloat(b.ops) - 0.7) * 50 + (p.whip - 1.1) * 20));
      if (hitScore < 40) continue;
      edges.push({ gamePk: g.gamePk, game, market: "Batter Hits", pick: `${b.name} hits`, edgeScore: hitScore, reasoning: `${b.name} hits ${b.avg} with a ${b.ops} OPS (${b.hits} H, ${b.hr} HR) vs ${p.name} (${p.hand}HP, ${p.whip} WHIP).`, stats: { AVG: b.avg, OPS: b.ops, HR: b.hr, "P WHIP": p.whip, "P hand": `${p.hand}HP` }, pitcher: p.name, team: m.opp });
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
