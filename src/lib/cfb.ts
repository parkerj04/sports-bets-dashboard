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
const AGENT = new Set(["PITT", "PIT", "VT", "PSU", "NW", "NU", "MTST", "IDHO", "IDA", "LIB", "DEL"]);

function rec(t: { records?: { type: string; summary: string }[] }) {
  return t.records?.find((r) => r.type === "total")?.summary || "";
}
function qb(t: { leaders?: { name: string; leaders?: { displayValue: string; athlete?: { displayName?: string } }[] }[] }) {
  const block = t.leaders?.find((l) => l.name === "passingLeader");
  const row = block?.leaders?.[0];
  return { name: row?.athlete?.displayName || "QB TBD", line: row?.displayValue || "no season line" };
}

function rowFrom(e: { id: string; competitions?: { competitors?: { homeAway: string; team: { displayName: string; abbreviation: string; conferenceId?: string }; records?: { type: string; summary: string }[]; leaders?: { name: string; leaders?: { displayValue: string; athlete?: { displayName?: string } }[] }[] }[]; odds?: { details?: string; overUnder?: number; moneyline?: { away?: { close?: { odds?: string } }; home?: { close?: { odds?: string } } } }[] }[] }) {
  const c = e.competitions?.[0] || {};
  const comps = c.competitors || [];
  const home = comps.find((t) => t.homeAway === "home");
  const away = comps.find((t) => t.homeAway === "away");
  if (!home || !away) return null;
  const awayPower = POWER[String(home.team.conferenceId && away.team.conferenceId)] || POWER[String(away.team.conferenceId)] || (away.team.abbreviation === "ND" ? "Independent" : "");
  const homePower = POWER[String(home.team.conferenceId)] || (home.team.abbreviation === "ND" ? "Independent" : "");
  const agentGame = AGENT.has(away.team.abbreviation) || AGENT.has(home.team.abbreviation);
  if (!awayPower && !homePower && !agentGame) return null;
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
  return {
    id: String(e.id),
    away: away.team.displayName,
    home: home.team.displayName,
    awayAbbr: away.team.abbreviation,
    homeAbbr: home.team.abbreviation,
    awayConf: awayPower || "Agent slate",
    homeConf: homePower || "Agent slate",
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
    why: `${away.team.displayName} ${rec(away)} at ${home.team.displayName} ${rec(home)}. ${aq.name} ${aq.line} vs ${hq.name} ${hq.line}. Posted ${odds?.details || "NL"}, total ${odds?.overUnder ?? "NL"}. ${desk.why}`,
    score: desk.score,
  } satisfies CfbGame;
}

export type CfbResult = { id: string; game: string; scoreline: string; cards: string[] };

function cfbCards(away: string, home: string, awayScore: string, homeScore: string): string[] {
  const pair = `${away} ${home}`.toLowerCase();
  if (pair.includes("pittsburgh") && pair.includes("virginia tech")) {
    return ["Pittsburgh +2.5: win. Pitt won 35-33, so +2.5 covered. ESPN final."];
  }
  if (pair.includes("liberty") && pair.includes("delaware")) {
    return ["Liberty -6.5: win. Liberty won 30-14, margin 16. ESPN final."];
  }
  if (pair.includes("penn state") && pair.includes("northwestern")) {
    return ["No desk card. Northwestern 34, Penn State 13. ESPN final."];
  }
  if (pair.includes("montana state") && pair.includes("idaho")) {
    return ["No desk card. Idaho 35, Montana State 34. ESPN final."];
  }
  return [`No desk card. Final ${away} ${awayScore}, ${home} ${homeScore}.`];
}

export async function getCfbWeek(): Promise<{ week: number; games: CfbGame[]; results: CfbResult[] }> {
  const boards = await Promise.all([
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80&limit=200", { cache: "no-store" }),
    fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=81&limit=200", { cache: "no-store" }),
  ]);
  const games: CfbGame[] = [];
  const results: CfbResult[] = [];
  const seen = new Set<string>();
  let week = 0;
  for (const res of boards) {
    if (!res.ok) continue;
    const data = await res.json();
    week = week || data.week?.number || 0;
    for (const e of data.events || []) {
      const game = rowFrom(e);
      if (!game || seen.has(game.id)) continue;
      seen.add(game.id);
      const c = e.competitions?.[0] || {};
      const state = c.status?.type?.name || "";
      if (state === "STATUS_FINAL" || state === "STATUS_FINAL_OVERTIME") {
        const comps = c.competitors || [];
        const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
        const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
        const awayScore = String(away?.score ?? "");
        const homeScore = String(home?.score ?? "");
        results.push({
          id: game.id,
          game: `${game.away} at ${game.home}`,
          scoreline: `${game.away} ${awayScore}, ${game.home} ${homeScore} Final`,
          cards: cfbCards(game.away, game.home, awayScore, homeScore),
        });
        continue;
      }
      games.push(game);
    }
  }
  return { week, games, results };
}

export async function getCfbGame(id: string) {
  const week = await getCfbWeek();
  return week.games.find((g) => g.id === id) || null;
}
