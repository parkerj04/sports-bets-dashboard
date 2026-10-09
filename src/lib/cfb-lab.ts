export type CfbStat = { label: string; home: string; away: string };
export type CfbInjury = { team: string; name: string; status: string; desc: string };
export type CfbL5 = { team: string; result: string; score: string; opp: string };
export type CfbLab = {
  venue: string;
  stats: CfbStat[];
  predHome?: string;
  predAway?: string;
  leaders: { team: string; category: string; name: string; value: string }[];
  injuries: CfbInjury[];
  lastFive: CfbL5[];
};

export async function getCfbLab(id: string): Promise<CfbLab> {
  const empty = { venue: "", stats: [], leaders: [], injuries: [], lastFive: [] };
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
  const injuries: CfbInjury[] = [];
  for (const block of d.injuries || []) {
    const team = block.team?.displayName || "";
    for (const inj of block.injuries || []) {
      injuries.push({
        team,
        name: inj.athlete?.displayName || inj.shortName || "",
        status: inj.status || inj.type?.description || "",
        desc: inj.details?.detail || inj.longComment || inj.shortComment || "",
      });
    }
  }
  const lastFive: CfbL5[] = [];
  for (const block of d.lastFiveGames || []) {
    const team = block.team?.displayName || "";
    for (const ev of (block.events || block.previousEvents || []).slice(0, 5)) {
      lastFive.push({
        team,
        result: ev.gameResult || ev.result || "",
        score: ev.score || ev.shortScore || "",
        opp: ev.opponent?.displayName || ev.opponent?.abbreviation || ev.atVs || "",
      });
    }
  }
  return {
    venue: d.gameInfo?.venue?.fullName || "",
    stats: Array.from(labels.entries()).map(([label, v]) => ({ label, home: v.home, away: v.away })),
    predHome: d.predictor?.homeTeam?.gameProjection,
    predAway: d.predictor?.awayTeam?.gameProjection,
    leaders,
    injuries: injuries.slice(0, 24),
    lastFive,
  };
}
