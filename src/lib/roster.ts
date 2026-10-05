import news from "@/data/nfl-news.json";

export type RosterSide = {
  team: string;
  count: number;
  names: string[];
  movedOut: string[];
  movedIn: string[];
  confirmed: boolean;
};

const ESPN: Record<string, string> = { WSH: "WSH", WAS: "WSH", LAR: "LAR", LA: "LAR" };

export async function rosterNames(abbr: string) {
  const code = ESPN[abbr.toUpperCase()] || abbr.toUpperCase();
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${code}/roster`, { next: { revalidate: 300 } });
  const names: string[] = [];
  if (!res.ok) return names;
  const data = await res.json();
  for (const group of data.athletes || []) {
    for (const p of group.items || []) names.push(p.displayName || p.fullName || "");
  }
  return names.filter(Boolean);
}

export function lastToken(name: string) {
  const token = name.trim().toLowerCase().split(/\s+/).pop() || "";
  return token.includes(".") ? token.split(".").pop() || "" : token;
}

export function onRoster(name: string, roster: string[]) {
  const last = lastToken(name);
  if (!last || last.length < 3) return false;
  if (roster.length === 0) return true;
  return roster.some((n) => lastToken(n) === last);
}

export function prettyName(short: string, roster: string[]) {
  if (!short.includes(".")) return short;
  const [pre, lastRaw] = short.split(".");
  const hits = roster.filter((n) => lastToken(n) === lastRaw.toLowerCase());
  if (hits.length === 1) return hits[0];
  const preL = pre.toLowerCase();
  return hits.find((n) => n.split(" ")[0].toLowerCase().startsWith(preL)) || short;
}

export async function nflRoster(abbr: string, team: string): Promise<RosterSide> {
  const names = await rosterNames(abbr);
  return stamp(team, names);
}

export async function mlbRoster(teamId: number, team: string): Promise<RosterSide> {
  const res = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`, { next: { revalidate: 300 } });
  const data = res.ok ? await res.json() : {};
  const names = (data.roster || []).map((r: { person?: { fullName?: string } }) => r.person?.fullName || "").filter(Boolean);
  return stamp(team, names);
}

function stamp(team: string, names: string[]): RosterSide {
  const movedOut: string[] = [];
  const movedIn: string[] = [];
  for (const n of news as { teams: string[]; headline: string }[]) {
    if (!n.teams.includes(team)) continue;
    const who = n.headline.match(/traded ([A-Z][a-z]+(?: [A-Z][a-z.]+)+)/)?.[1];
    if (!who) continue;
    const on = names.some((x) => x.includes(who));
    const last = team.split(" ").pop() || "";
    if (n.headline.startsWith(team) && on) movedOut.push(who);
    if (new RegExp(`to the ${last}`, "i").test(n.headline) && !on) movedIn.push(`${who} not on the public roster yet`);
  }
  return {
    team,
    count: names.length,
    names: names.slice(0, 8),
    movedOut,
    movedIn,
    confirmed: names.length > 20 && movedOut.length === 0,
  };
}
