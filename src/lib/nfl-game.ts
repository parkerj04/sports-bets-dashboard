export type NflStat = { label: string; home: string; away: string };
export type NflInjury = { team: string; name: string; status: string; desc: string };
export type NflLeader = { team: string; category: string; name: string; value: string };
export type NflL5 = { team: string; result: string; score: string; opp: string };

export type NflLab = {
  id: string;
  name: string;
  date: string;
  status: string;
  venue: string;
  home: string;
  away: string;
  homeAbbr: string;
  awayAbbr: string;
  spread: string;
  total: string;
  mlHome: string;
  mlAway: string;
  predHome?: string;
  predAway?: string;
  stats: NflStat[];
  injuries: NflInjury[];
  leaders: NflLeader[];
  lastFive: NflL5[];
};

export async function getNflLab(id: string): Promise<NflLab | null> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`,
    { next: { revalidate: 180 } }
  );
  if (!res.ok) return null;
  const d = await res.json();
  const header = d.header || {};
  const comps = header.competitions?.[0] || {};
  const teams = comps.competitors || [];
  const home = teams.find((t: { homeAway: string }) => t.homeAway === "home");
  const away = teams.find((t: { homeAway: string }) => t.homeAway === "away");
  const odds = (d.odds || [])[0] || comps.odds?.[0] || {};
  const boxTeams = d.boxscore?.teams || [];
  const homeBox = boxTeams.find((t: { team?: { id?: string } }) => t.team?.id === home?.id) || boxTeams[1];
  const awayBox = boxTeams.find((t: { team?: { id?: string } }) => t.team?.id === away?.id) || boxTeams[0];
  const labels = new Map<string, { home: string; away: string }>();
  for (const s of homeBox?.statistics || []) labels.set(s.label, { home: String(s.displayValue ?? s.value ?? ""), away: "" });
  for (const s of awayBox?.statistics || []) {
    const cur = labels.get(s.label) || { home: "", away: "" };
    cur.away = String(s.displayValue ?? s.value ?? "");
    labels.set(s.label, cur);
  }
  const stats: NflStat[] = Array.from(labels.entries()).map(([label, v]) => ({ label, home: v.home, away: v.away }));

  const injuries: NflInjury[] = [];
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

  const leaders: NflLeader[] = [];
  for (const block of d.leaders || []) {
    const team = block.team?.displayName || "";
    for (const cat of block.leaders || []) {
      const first = cat.leaders?.[0];
      if (!first) continue;
      leaders.push({
        team,
        category: cat.displayName || cat.name || "",
        name: first.athlete?.displayName || "",
        value: first.displayValue || "",
      });
    }
  }

  const lastFive: NflL5[] = [];
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

  const pred = d.predictor;
  return {
    id,
    name: header.gameNote || `${away?.team?.displayName || "Away"} at ${home?.team?.displayName || "Home"}`,
    date: comps.date || header.competitions?.[0]?.date || "",
    status: comps.status?.type?.description || "",
    venue: d.gameInfo?.venue?.fullName || "",
    home: home?.team?.displayName || "Home",
    away: away?.team?.displayName || "Away",
    homeAbbr: home?.team?.abbreviation || "",
    awayAbbr: away?.team?.abbreviation || "",
    spread: odds.details || odds.spread || "NL",
    total: String(odds.overUnder ?? odds.ou ?? "NL"),
    mlHome: String(odds.homeTeamOdds?.moneyLine ?? odds.moneyline?.home?.close?.odds ?? ""),
    mlAway: String(odds.awayTeamOdds?.moneyLine ?? odds.moneyline?.away?.close?.odds ?? ""),
    predHome: pred?.homeTeam?.gameProjection,
    predAway: pred?.awayTeam?.gameProjection,
    stats,
    injuries: injuries.slice(0, 24),
    leaders,
    lastFive,
  };
}
