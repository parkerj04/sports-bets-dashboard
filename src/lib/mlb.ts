/**
 * Free MLB Stats API helpers + simple edge scorer.
 * No API key required. https://statsapi.mlb.com
 */

const BASE = "https://statsapi.mlb.com/api/v1";

export interface GameMatchup {
  gamePk: number;
  awayTeam: string;
  homeTeam: string;
  awayId: number;
  homeId: number;
  awayPitcher: string | null;
  homePitcher: string | null;
  awayPitcherId: number | null;
  homePitcherId: number | null;
  venue: string;
  status: string;
}

export interface PitcherStats {
  id: number;
  name: string;
  strikeOuts: number;
  inningsPitched: number;
  k9: number;
  era: number;
  whip: number;
  gamesStarted: number;
}

export interface TeamKStats {
  teamId: number;
  name: string;
  strikeOuts: number;
  plateAppearances: number;
  kPct: number;
}

export interface Edge {
  game: string;
  market: "Pitcher Ks" | "Team Total Hits" | "Batter Hits";
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
  const res = await fetch(url, { next: { revalidate: 300 } });
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
        awayId: away?.team?.id,
        homeId: home?.team?.id,
        awayPitcher: away?.probablePitcher?.fullName || null,
        homePitcher: home?.probablePitcher?.fullName || null,
        awayPitcherId: away?.probablePitcher?.id || null,
        homePitcherId: home?.probablePitcher?.id || null,
        venue: g.venue?.name || "",
        status: g.status?.detailedState || "",
      });
    }
  }
  return games;
}

export async function getPitcherSeasonStats(
  playerId: number,
  season = 2026
): Promise<PitcherStats | null> {
  const url = `${BASE}/people/${playerId}/stats?stats=season&group=pitching&season=${season}&sportId=1`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const split = data.stats?.[0]?.splits?.[0];
  if (!split) return null;
  const s = split.stat;
  const ip = parseFloat(s.inningsPitched || "0");
  const so = s.strikeOuts || 0;
  return {
    id: playerId,
    name: split.player?.fullName || "",
    strikeOuts: so,
    inningsPitched: ip,
    k9: ip > 0 ? Math.round((so / ip) * 9 * 100) / 100 : 0,
    era: parseFloat(s.era || "0"),
    whip: parseFloat(s.whip || "0"),
    gamesStarted: s.gamesStarted || 0,
  };
}

export async function getTeamKPct(
  teamId: number,
  season = 2026
): Promise<TeamKStats | null> {
  const url = `${BASE}/teams/${teamId}/stats?stats=season&group=hitting&season=${season}&sportIds=1`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  const split = data.stats?.[0]?.splits?.[0];
  if (!split) return null;
  const s = split.stat;
  const so = s.strikeOuts || 0;
  const pa = s.plateAppearances || s.atBats || 1;
  return {
    teamId,
    name: split.team?.name || "",
    strikeOuts: so,
    plateAppearances: pa,
    kPct: Math.round((so / pa) * 1000) / 10,
  };
}

export async function findTodaysEdges(date?: string): Promise<Edge[]> {
  const games = await getTodaysGames(date);
  const edges: Edge[] = [];

  for (const g of games) {
    const matchups = [
      {
        pitcherId: g.homePitcherId,
        pitcherName: g.homePitcher,
        opposingTeamId: g.awayId,
        opposingTeam: g.awayTeam,
      },
      {
        pitcherId: g.awayPitcherId,
        pitcherName: g.awayPitcher,
        opposingTeamId: g.homeId,
        opposingTeam: g.homeTeam,
      },
    ];

    for (const m of matchups) {
      if (!m.pitcherId || !m.pitcherName) continue;

      const [pStats, tStats] = await Promise.all([
        getPitcherSeasonStats(m.pitcherId),
        getTeamKPct(m.opposingTeamId),
      ]);

      if (!pStats || !tStats || pStats.inningsPitched < 20) continue;

      const k9Score = Math.min(100, Math.max(0, ((pStats.k9 - 7.5) / 6) * 100));
      const kPctScore = Math.min(100, Math.max(0, ((tStats.kPct - 18) / 12) * 100));
      const edgeScore = Math.round(k9Score * 0.55 + kPctScore * 0.45);

      if (edgeScore < 45) continue;

      let tier = "Moderate";
      if (edgeScore >= 75) tier = "Strong";
      else if (edgeScore >= 60) tier = "Good";

      edges.push({
        game: `${g.awayTeam} @ ${g.homeTeam}`,
        market: "Pitcher Ks",
        pick: `${m.pitcherName} Over Ks (or opposing team Under Hits)`,
        edgeScore,
        reasoning: `${m.pitcherName} posts a ${pStats.k9} K/9 this season. ${m.opposingTeam} strike out ${tStats.kPct}% of the time (league avg ~22%). ${tier} strikeout environment.`,
        stats: {
          "Pitcher K/9": pStats.k9,
          "Pitcher ERA": pStats.era,
          "Pitcher WHIP": pStats.whip,
          "Opp K%": `${tStats.kPct}%`,
          "Opp SO": tStats.strikeOuts,
          IP: pStats.inningsPitched,
        },
        pitcher: m.pitcherName,
        team: m.opposingTeam,
      });
    }
  }

  edges.sort((a, b) => b.edgeScore - a.edgeScore);
  return edges;
}
