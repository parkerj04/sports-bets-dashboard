export type CfbGame = {
  id: string;
  away: string;
  home: string;
  awayAbbr: string;
  homeAbbr: string;
  awayConf: string;
  homeConf: string;
  awayRecord: string;
  homeRecord: string;
  spread: string;
  total: string | number;
  mlAway: string;
  mlHome: string;
  awayQb: string;
  homeQb: string;
  awayQbLine: string;
  homeQbLine: string;
  lean: string;
  why: string;
  score: number;
};

import { footballRegistry } from "./football-desk";

const POWER: Record<string, string> = { "1": "ACC", "4": "Big 12", "5": "Big Ten", "8": "SEC" };

function rec(t: { records?: { type: string; summary: string }[] }) {
  return t.records?.find((r) => r.type === "total")?.summary || "";
}
function qb(t: { leaders?: { name: string; leaders?: { displayValue: string; athlete?: { displayName?: string } }[] }[] }) {
  const block = t.leaders?.find((l) => l.name === "passingLeader");
  const row = block?.leaders?.[0];
  return { name: row?.athlete?.displayName || "QB TBD", line: row?.displayValue || "no season line" };
}

export async function getCfbWeek(): Promise<{ week: number; games: CfbGame[] }> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=200", { next: { revalidate: 300 } });
  if (!res.ok) return { week: 0, games: [] };
  const data = await res.json();
  const games: CfbGame[] = [];
  for (const e of data.events || []) {
    const c = e.competitions?.[0] || {};
    const comps = c.competitors || [];
    const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
    const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
    if (!home || !away) continue;
    const awayPower = POWER[String(away.team.conferenceId)] || (away.team.abbreviation === "ND" ? "Independent" : "");
    const homePower = POWER[String(home.team.conferenceId)] || (home.team.abbreviation === "ND" ? "Independent" : "");
    if (!awayPower && !homePower) continue;
    const odds = c.odds?.[0];
    const aq = qb(away); const hq = qb(home);
    const desk = footballRegistry({
      away: away.team.displayName,
      home: home.team.displayName,
      awayRecord: rec(away),
      homeRecord: rec(home),
      mlAway: odds?.moneyline?.away?.close?.odds || "",
      mlHome: odds?.moneyline?.home?.close?.odds || "",
      awayQb: aq.name,
      homeQb: hq.name,
      awayQbLine: aq.line,
      homeQbLine: hq.line,
    });
    games.push({
      id: String(e.id),
      away: away.team.displayName,
      home: home.team.displayName,
      awayAbbr: away.team.abbreviation,
      homeAbbr: home.team.abbreviation,
      awayConf: awayPower || "Other",
      homeConf: homePower || "Other",
      awayRecord: rec(away),
      homeRecord: rec(home),
      spread: odds?.details || "NL",
      total: odds?.overUnder ?? "NL",
      mlAway: odds?.moneyline?.away?.close?.odds || "",
      mlHome: odds?.moneyline?.home?.close?.odds || "",
      awayQb: aq.name,
      homeQb: hq.name,
      awayQbLine: aq.line,
      homeQbLine: hq.line,
      lean: desk.pick,
      why: `${away.team.displayName} ${rec(away)} (${awayPower || "other"}) at ${home.team.displayName} ${rec(home)} (${homePower || "other"}). ${aq.name} ${aq.line} vs ${hq.name} ${hq.line}. Posted ${odds?.details || "NL"}, total ${odds?.overUnder ?? "NL"}. ${desk.why}`,
      score: desk.score,
    });
  }
  return { week: data.week?.number || 0, games };
}

export async function getCfbGame(id: string) {
  const week = await getCfbWeek();
  return week.games.find((g) => g.id === id) || null;
}
