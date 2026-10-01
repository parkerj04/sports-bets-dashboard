import news from "@/data/nfl-news.json";

export type RosterSide = {
  team: string;
  count: number;
  names: string[];
  movedOut: string[];
  movedIn: string[];
  confirmed: boolean;
};

function namesFrom(data: { athletes?: { items?: { displayName?: string; fullName?: string }[] }[]; roster?: { fullName?: string }[] }) {
  const out: string[] = [];
  for (const group of data.athletes || []) {
    for (const p of group.items || []) out.push(p.displayName || p.fullName || "");
  }
  for (const p of data.roster || []) out.push(p.fullName || "");
  return out.filter(Boolean);
}

export async function nflRoster(abbr: string, team: string): Promise<RosterSide> {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbr}/roster`, { next: { revalidate: 300 } });
  const names = res.ok ? namesFrom(await res.json()) : [];
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
  for (const n of news as { teams: string[]; headline: string; detail: string }[]) {
    if (!n.teams.includes(team)) continue;
    const who = n.headline.match(/traded ([A-Z][a-z]+(?: [A-Z][a-z.]+)+)/)?.[1];
    if (!who) continue;
    const on = names.some((x) => x.includes(who));
    if (/traded .* to the/i.test(n.headline) && n.headline.startsWith(team.split(" ").slice(-1)[0]) && on) movedOut.push(who);
    if (/to the .*${team.split(" ").pop()}/i.test(n.headline) && !on) movedIn.push(`${who} not on the public roster yet`);
  }
  const porter = team.includes("Steelers") && names.some((x) => x.includes("Porter"));
  if (porter) movedOut.push("Joey Porter Jr.");
  const dallasWaiting = team.includes("Cowboys") && !names.some((x) => x.includes("Porter"));
  if (dallasWaiting) movedIn.push("Joey Porter Jr. not on the public Dallas roster yet");
  return {
    team,
    count: names.length,
    names: names.slice(0, 8),
    movedOut: Array.from(new Set(movedOut)),
    movedIn: Array.from(new Set(movedIn)),
    confirmed: names.length > 20 && movedOut.length === 0,
  };
}
