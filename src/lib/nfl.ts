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

export async function getNflWeek(): Promise<{ week: number; games: NflGame[] }> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2",
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return { week: 0, games: [] };
  const data = await res.json();
  const week = data.week?.number || 0;
  const games: NflGame[] = [];
  for (const e of data.events || []) {
    const c = e.competitions?.[0] || {};
    const comps = c.competitors || [];
    const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
    const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
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
        status: e.status?.type?.description || "",
        venue: c.venue?.fullName || "",
        broadcast: c.broadcasts?.[0]?.names?.[0] || "",
        week,
        away: away?.team?.displayName || "Away",
        home: home?.team?.displayName || "Home",
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
  return { week, games };
}
