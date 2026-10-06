export interface NflGame {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  venue: string;
  broadcast: string;
  week: number;
  away: string;
  home: string;
  awayRecord: string;
  homeRecord: string;
  spread: string;
  total: string | number;
  mlAway: string;
  mlHome: string;
  leanML?: string;
  leanTotal?: string;
  leanWhy?: string;
  leanScore?: number;
}

export type SlateResult = {
  id: string;
  game: string;
  scoreline: string;
  cards: string[];
};

import { impliedTotals } from "./ticket";
import { footballRegistry } from "./football-desk";
import { newsLine } from "./nfl-news";

function scoreGame(g: Omit<NflGame, "leanML" | "leanTotal" | "leanWhy" | "leanScore">): NflGame {
  const total = typeof g.total === "number" ? g.total : parseFloat(String(g.total)) || 44;
  const desk = footballRegistry({
    away: g.away,
    home: g.home,
    awayRecord: g.awayRecord,
    homeRecord: g.homeRecord,
    mlAway: g.mlAway,
    mlHome: g.mlHome,
  });
  const leanTotal = total >= 47.5 ? "Under" : total <= 41 ? "Over" : "No total lean";
  const imp = impliedTotals(g.total, g.spread, g.home, g.away);
  const news = newsLine(g.away, g.home);
  const leanWhy =
    `${g.away} ${g.awayRecord} at ${g.home} ${g.homeRecord}, ${g.venue || "site TBD"}. Posted ${g.spread}, total ${total}, ML ${g.mlAway || "—"}/${g.mlHome || "—"}. ` +
    (imp ? `Implied points ${g.away} ${imp.awayImp} / ${g.home} ${imp.homeImp}. ` : "") +
    (news ? `${news} ` : "") +
    `${desk.why} Total note: ${leanTotal} at ${total}, and that is a number read, not a play. Open the game lab before a unit. Injuries, QB status, and last 5 are not on this slate card.`;
  return { ...g, leanML: desk.pick, leanTotal, leanWhy, leanScore: desk.score };
}

function deskCards(away: string, home: string, awayScore: string, homeScore: string): string[] {
  const a = away.toLowerCase();
  const h = home.toLowerCase();
  if (a.includes("steelers") && h.includes("browns")) {
    return [
      "Jaylen Warren over 15.5 rush attempts: win, 17 carries (ESPN box).",
      "Jaylen Warren over 67.5 rush yards: win, 93 yards.",
      "Pat Freiermuth over 27.5 receiving yards: loss, 3 catches for 17 yards. He did score a TD; the yards card still missed.",
      "Harold Fannin Jr. anytime touchdown: win, 1 receiving TD (3 catches, 27 yards).",
      "Under 38.5: loss, 24-27, total 51.",
    ];
  }
  return [`No desk card. Final ${away} ${awayScore}, ${home} ${homeScore}.`];
}

export async function getNflWeek(): Promise<{ week: number; games: NflGame[]; results: SlateResult[]; checked: string }> {
  const board = async (week?: number) => {
    const url = week
      ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}`
      : "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2";
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return res.json();
  };
  let data = await board();
  if (!data) return { week: 0, games: [], results: [], checked: "ESPN NFL scoreboard unavailable" };
  const done = (e: { competitions?: { status?: { type?: { name?: string } } }[]; status?: { type?: { name?: string } } }) => {
    const c = e.competitions?.[0];
    const state = c?.status?.type?.name || e.status?.type?.name || "";
    return state === "STATUS_FINAL" || state === "STATUS_FINAL_OVERTIME";
  };
  const events = data.events || [];
  let rolled = 0;
  if (events.length > 0 && events.every(done)) {
    rolled = (data.week?.number || 0) + 1;
    const next = await board(rolled);
    if (next?.events?.length) data = next;
    else rolled = 0;
  }
  const week = data.week?.number || 0;
  const games: NflGame[] = [];
  const results: SlateResult[] = [];
  for (const e of data.events || []) {
    const c = e.competitions?.[0] || {};
    const comps = c.competitors || [];
    const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
    const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
    const state = c.status?.type?.name || e.status?.type?.name || "";
    const awayName = away?.team?.displayName || "Away";
    const homeName = home?.team?.displayName || "Home";
    if (state === "STATUS_FINAL" || state === "STATUS_FINAL_OVERTIME") {
      const awayScore = String(away?.score ?? "");
      const homeScore = String(home?.score ?? "");
      results.push({
        id: String(e.id),
        game: `${awayName} at ${homeName}`,
        scoreline: `${awayName} ${awayScore}, ${homeName} ${homeScore} Final`,
        cards: deskCards(awayName, homeName, awayScore, homeScore),
      });
      continue;
    }
    const rec = (t: { records?: { type: string; summary: string }[] } | undefined) =>
      t?.records?.find((r) => r.type === "total")?.summary || "";
    const odds = c.odds?.[0];
    const ml = odds?.moneyline;
    games.push(
      scoreGame({
        id: String(e.id),
        name: e.name,
        shortName: e.shortName,
        date: e.date,
        status: c.status?.type?.description || e.status?.type?.description || "",
        venue: c.venue?.fullName || "",
        broadcast: c.broadcasts?.[0]?.names?.[0] || "",
        week,
        away: awayName,
        home: homeName,
        awayRecord: rec(away),
        homeRecord: rec(home),
        spread: odds?.details || "NL",
        total: odds?.overUnder ?? "NL",
        mlAway: ml?.away?.close?.odds || "",
        mlHome: ml?.home?.close?.odds || "",
      })
    );
  }
  games.sort((a, b) => a.date.localeCompare(b.date));
  const checked = rolled
    ? `Week ${rolled - 1} is final. Showing Week ${week}. Thursday night is the first game.`
    : `ESPN NFL scoreboard, Week ${week}. Finals removed from the slate.`;
  return { week, games, results, checked };
}

/** One game. Does not download the whole week. */
export async function getNflCard(id: string): Promise<NflGame | null> {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const e = await res.json();
  const c = e.competitions?.[0];
  if (!c) return null;
  const comps = c.competitors || [];
  const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
  const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
  const rec = (t: { records?: { type: string; summary: string }[] } | undefined) =>
    t?.records?.find((r) => r.type === "total")?.summary || "";
  const odds = c.odds?.[0];
  const ml = odds?.moneyline;
  return scoreGame({
    id: String(e.id || id),
    name: e.name || "",
    shortName: e.shortName || "",
    date: e.date || c.date || "",
    status: c.status?.type?.description || e.status?.type?.description || "",
    venue: c.venue?.fullName || "",
    broadcast: c.broadcasts?.[0]?.names?.[0] || "",
    week: e.week?.number || 0,
    away: away?.team?.displayName || "Away",
    home: home?.team?.displayName || "Home",
    awayRecord: rec(away),
    homeRecord: rec(home),
    spread: odds?.details || "NL",
    total: odds?.overUnder ?? "NL",
    mlAway: ml?.away?.close?.odds || "",
    mlHome: ml?.home?.close?.odds || "",
  });
}
