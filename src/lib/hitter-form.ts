import { mergeLogs, personLogUrls, readSplits } from "./mlb-log";

export type HitterLog = {
  id: number;
  name: string;
  games: { date: string; ab: number; h: number; hr: number; so: number; rbi: number }[];
  l5h: number;
  l5ab: number;
  l5hr: number;
};

export async function getHitterLogs(playerId: number, name: string, season = 2026): Promise<HitterLog> {
  const payloads = await Promise.all(
    personLogUrls(playerId, "hitting", season).map(async (url) => {
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return null;
      return res.json();
    })
  );
  const games = [];
  for (const s of mergeLogs(payloads.map(readSplits))) {
    const st = s.stat || {};
    games.push({
      date: s.date || "",
      ab: Number(st.atBats) || 0,
      h: Number(st.hits) || 0,
      hr: Number(st.homeRuns) || 0,
      so: Number(st.strikeOuts) || 0,
      rbi: Number(st.rbi) || 0,
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
