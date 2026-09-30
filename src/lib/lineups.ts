const BASE = "https://statsapi.mlb.com/api/v1";

export type LineupBat = {
  id: number;
  name: string;
  slot: number;
  pos: string;
};

export type GameLineups = {
  posted: boolean;
  away: LineupBat[];
  home: LineupBat[];
};

export async function getLineups(gamePk: number): Promise<GameLineups> {
  const url = `${BASE}/schedule?sportId=1&gamePk=${gamePk}&hydrate=lineups`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const empty: GameLineups = { posted: false, away: [], home: [] };
  if (!res.ok) return empty;
  const data = await res.json();
  const g = data.dates?.[0]?.games?.[0];
  const L = g?.lineups;
  if (!L) return empty;
  const map = (rows: { id: number; fullName: string; primaryPosition?: { abbreviation?: string } }[] | undefined) =>
    (rows || []).map((p, i) => ({
      id: p.id,
      name: p.fullName,
      slot: i + 1,
      pos: p.primaryPosition?.abbreviation || "",
    }));
  const away = map(L.awayPlayers);
  const home = map(L.homePlayers);
  return { posted: away.length > 0 || home.length > 0, away, home };
}
