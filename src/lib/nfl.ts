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

function winPct(rec: string) {
  const m = rec.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 0.5;
  const w = Number(m[1]);
  const l = Number(m[2]);
  return w + l === 0 ? 0.5 : w / (w + l);
}

function scoreGame(g: Omit<NflGame, "leanML" | "leanTotal" | "leanWhy" | "leanScore">): NflGame {
  const aw = winPct(g.awayRecord);
  const hm = winPct(g.homeRecord);
  const total = typeof g.total === "number" ? g.total : parseFloat(String(g.total)) || 44;
  const gap = hm - aw;
  let leanML = hm >= aw ? `${g.home} ML` : `${g.away} ML`;
  if (Math.abs(gap) < 0.08) leanML = `Lean home ${g.home} (small edge)`;
  const leanTotal = total >= 46.5 ? "Under" : total <= 41.5 ? "Over" : hm + aw > 1.15 ? "Over" : "Under";
  const leanScore = Math.min(72, Math.round(48 + Math.abs(gap) * 40 + Math.min(8, Math.abs(total - 44))));
  const imp = impliedTotals(g.total, g.spread, g.home, g.away);
  const leanWhy =
    `${g.away} ${g.awayRecord} at ${g.home} ${g.homeRecord}, ${g.venue || "site TBD"}. Posted ${g.spread}, total ${total}, ML ${g.mlAway || "—"}/${g.mlHome || "—"}. ` +
    (imp ? `Implied points ${g.away} ${imp.awayImp} / ${g.home} ${imp.homeImp}. ` : "") +
    (Math.abs(gap) >= 0.15
      ? `Record gap is real (${g.awayRecord} vs ${g.homeRecord}), so the ML lean is ${leanML}.`
      : `Records are close (${g.awayRecord} vs ${g.homeRecord}). ML lean ${leanML} is a home/record tie-break, not a mismatch.`) +
    ` Total lean ${leanTotal} because the number sits at ${total}. ` +
    `Case against: this slate card does not settle inactives. Open the game lab ticket desk before a unit. Do not treat ${leanScore} as an 80.`;
  return { ...g, leanML, leanTotal, leanWhy, leanScore };
}

export async function getNflWeek(): Promise<{ week: number; games: NflGame[] }> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
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
