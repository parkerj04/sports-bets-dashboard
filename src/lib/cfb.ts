export type CfbGame = {
  id: string;
  away: string;
  home: string;
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

function rec(t: { records?: { type: string; summary: string }[] }) {
  return t.records?.find((r) => r.type === "total")?.summary || "";
}
function qb(t: { leaders?: { name: string; leaders?: { displayValue: string; athlete?: { displayName?: string } }[] }[] }) {
  const block = t.leaders?.find((l) => l.name === "passingLeader");
  const row = block?.leaders?.[0];
  return { name: row?.athlete?.displayName || "QB TBD", line: row?.displayValue || "no season line" };
}
function wins(rec: string) {
  const m = rec.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 0.5;
  const w = Number(m[1]); const l = Number(m[2]);
  return w + l === 0 ? 0.5 : w / (w + l);
}

export async function getCfbWeek(): Promise<{ week: number; games: CfbGame[] }> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard", { next: { revalidate: 300 } });
  if (!res.ok) return { week: 0, games: [] };
  const data = await res.json();
  const games: CfbGame[] = [];
  for (const e of data.events || []) {
    const c = e.competitions?.[0] || {};
    const comps = c.competitors || [];
    const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
    const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
    if (!home || !away) continue;
    const odds = c.odds?.[0];
    const aq = qb(away); const hq = qb(home);
    const gap = wins(rec(home)) - wins(rec(away));
    const total = odds?.overUnder ?? "NL";
    const lean = gap >= 0 ? `${home.team.abbreviation} side, QB ${hq.name}` : `${away.team.abbreviation} side, QB ${aq.name}`;
    const why = `QB is the card. ${away.team.abbreviation} ${aq.name} (${aq.line}) vs ${home.team.abbreviation} ${hq.name} (${hq.line}). Records ${rec(away)} / ${rec(home)}. In college the better passing season line plus the better record is the lean, not the juice. Spread ${odds?.details || "NL"} is context only.`;
    games.push({
      id: String(e.id),
      away: away.team.displayName,
      home: home.team.displayName,
      awayRecord: rec(away),
      homeRecord: rec(home),
      spread: odds?.details || "NL",
      total,
      mlAway: odds?.moneyline?.away?.close?.odds || "",
      mlHome: odds?.moneyline?.home?.close?.odds || "",
      awayQb: aq.name,
      homeQb: hq.name,
      awayQbLine: aq.line,
      homeQbLine: hq.line,
      lean,
      why,
      score: Math.min(84, Math.round(52 + Math.abs(gap) * 40)),
    });
  }
  return { week: data.week?.number || 0, games };
}
