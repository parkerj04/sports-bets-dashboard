export type MlbLine = {
  name: string;
  away: string;
  home: string;
  spread: string;
  total: string | number;
  mlAway: string;
  mlHome: string;
};

export async function getMlbLines(): Promise<MlbLine[]> {
  const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard", {
    next: { revalidate: 180 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const out: MlbLine[] = [];
  for (const e of data.events || []) {
    const c = e.competitions?.[0] || {};
    const comps = c.competitors || [];
    const home = comps.find((t: { homeAway: string }) => t.homeAway === "home");
    const away = comps.find((t: { homeAway: string }) => t.homeAway === "away");
    const odds = c.odds?.[0];
    const ml = odds?.moneyline;
    out.push({
      name: e.name,
      away: away?.team?.displayName || "",
      home: home?.team?.displayName || "",
      spread: odds?.details || "NL",
      total: odds?.overUnder ?? "NL",
      mlAway: ml?.away?.close?.odds || "",
      mlHome: ml?.home?.close?.odds || "",
    });
  }
  return out;
}

export function matchLine(lines: MlbLine[], away: string, home: string) {
  const a = away.toLowerCase();
  const h = home.toLowerCase();
  return lines.find((l) => l.away.toLowerCase() === a && l.home.toLowerCase() === h)
    || lines.find((l) => a.includes(l.away.split(" ").pop() || "xxx") && h.includes(l.home.split(" ").pop() || "yyy"));
}
