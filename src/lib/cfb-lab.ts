export type CfbStat = { label: string; home: string; away: string };
export type CfbLab = {
  stats: CfbStat[];
  predHome?: string;
  predAway?: string;
  leaders: { team: string; category: string; name: string; value: string }[];
};

export async function getCfbLab(id: string): Promise<CfbLab> {
  const empty = { stats: [], leaders: [] };
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${id}`, { next: { revalidate: 180 } });
  if (!res.ok) return empty;
  const d = await res.json();
  const header = d.header?.competitions?.[0]?.competitors || [];
  const home = header.find((t: { homeAway: string }) => t.homeAway === "home");
  const away = header.find((t: { homeAway: string }) => t.homeAway === "away");
  const box = d.boxscore?.teams || [];
  const homeBox = box.find((t: { team?: { id?: string } }) => t.team?.id === home?.id) || box[1];
  const awayBox = box.find((t: { team?: { id?: string } }) => t.team?.id === away?.id) || box[0];
  const labels = new Map<string, { home: string; away: string }>();
  for (const s of homeBox?.statistics || []) labels.set(s.label, { home: String(s.displayValue ?? ""), away: "" });
  for (const s of awayBox?.statistics || []) {
    const cur = labels.get(s.label) || { home: "", away: "" };
    cur.away = String(s.displayValue ?? "");
    labels.set(s.label, cur);
  }
  const leaders = [];
  for (const block of d.leaders || []) {
    const team = block.team?.displayName || "";
    for (const cat of block.leaders || []) {
      const first = cat.leaders?.[0];
      if (!first) continue;
      leaders.push({ team, category: cat.displayName || "", name: first.athlete?.displayName || "", value: first.displayValue || "" });
    }
  }
  return {
    stats: Array.from(labels.entries()).map(([label, v]) => ({ label, home: v.home, away: v.away })),
    predHome: d.predictor?.homeTeam?.gameProjection,
    predAway: d.predictor?.awayTeam?.gameProjection,
    leaders,
  };
}
