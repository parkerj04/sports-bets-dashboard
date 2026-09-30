const BASE = "https://statsapi.mlb.com/api/v1";

export type HitterLog = {
  id: number;
  name: string;
  games: { date: string; ab: number; h: number; hr: number; so: number; rbi: number }[];
  l5h: number;
  l5ab: number;
  l5hr: number;
};

export async function getHitterLogs(playerId: number, name: string, season = 2026): Promise<HitterLog> {
  const res = await fetch(`${BASE}/people/${playerId}/stats?stats=gameLog&group=hitting&season=${season}`, {
    next: { revalidate: 900 },
  });
  const empty: HitterLog = { id: playerId, name, games: [], l5h: 0, l5ab: 0, l5hr: 0 };
  if (!res.ok) return empty;
  const data = await res.json();
  const games = [];
  for (const s of data.stats?.[0]?.splits || []) {
    const st = s.stat || {};
    games.push({
      date: s.date || "",
      ab: st.atBats || 0,
      h: st.hits || 0,
      hr: st.homeRuns || 0,
      so: st.strikeOuts || 0,
      rbi: st.rbi || 0,
    });
  }
  const last = games.slice(-5).reverse();
  return {
    id: playerId,
    name,
    games: last,
    l5h: last.reduce((s, g) => s + g.h, 0),
    l5ab: last.reduce((s, g) => s + g.ab, 0),
    l5hr: last.reduce((s, g) => s + g.hr, 0),
  };
}
