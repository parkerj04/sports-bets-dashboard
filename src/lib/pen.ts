export type Pen = { era: number; whip: number; ip: string; so: number };

export async function bullpen(teamId: number, season = 2026): Promise<Pen | null> {
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${season}&sportIds=1&sitCodes=rp`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return null;
  const data = await res.json();
  const s = data.stats?.[0]?.splits?.[0]?.stat;
  if (!s?.era) return null;
  return {
    era: parseFloat(s.era),
    whip: parseFloat(s.whip || "0"),
    ip: String(s.inningsPitched || ""),
    so: s.strikeOuts || 0,
  };
}
