import { unstable_cache } from "next/cache";

const FILE = "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv";
const NFL: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export type ScorerWeek = { week: number; td: number; rec: number; rush: number; catches: number; pass: number; passTd: number; opp: string };
export type Scorer = {
  name: string;
  team: string;
  pos: string;
  id: string;
  rec: number;
  rush: number;
  catches: number;
  pass: number;
  passTd: number;
  total: number;
  scored: number;
  weeks: ScorerWeek[];
};

type Raw = { name: string; team: string; pos: string; weeks: ScorerWeek[] };

function split(line: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

const load = unstable_cache(async (): Promise<Raw[]> => {
  const res = await fetch(FILE);
  if (!res.ok) return [];
  const text = await res.text();
  const lines = text.split("\n");
  const header = split(lines[0]);
  const col = (name: string) => header.indexOf(name);
  const i = {
    name: col("player_display_name"), team: col("team"), pos: col("position"),
    type: col("season_type"), week: col("week"), opp: col("opponent_team"),
    rushTd: col("rushing_tds"), recTd: col("receiving_tds"),
    rushYds: col("rushing_yards"), recYds: col("receiving_yards"),
    catches: col("receptions"), passYds: col("passing_yards"), passTd: col("passing_tds"),
  };
  const grouped = new Map<string, Raw>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const c = split(line);
    if (c[i.type] !== "REG") continue;
    if (!["WR", "TE", "RB", "QB"].includes(c[i.pos])) continue;
    const td = (Number(c[i.rushTd]) || 0) + (Number(c[i.recTd]) || 0);
    const rec = Number(c[i.recYds]) || 0;
    const rush = Number(c[i.rushYds]) || 0;
    const catches = Number(c[i.catches]) || 0;
    const pass = Number(c[i.passYds]) || 0;
    const passTd = Number(c[i.passTd]) || 0;
    const key = `${c[i.team]}|${c[i.name]}`;
    const row = grouped.get(key) || { name: c[i.name], team: c[i.team], pos: c[i.pos], weeks: [] };
    row.weeks.push({ week: Number(c[i.week]) || 0, td, rec, rush, catches, pass, passTd, opp: c[i.opp] || "" });
    grouped.set(key, row);
  }
  return Array.from(grouped.values());
}, ["nfl-player-weeks-2026-pass"], { revalidate: 3600 });

function keyOf(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

async function rosterIds(abbr: string) {
  const code = abbr === "WAS" ? "WSH" : abbr === "LA" ? "LAR" : abbr;
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${code}/roster`, { next: { revalidate: 300 } });
  const map = new Map<string, string>();
  if (!res.ok) return map;
  const data = await res.json();
  for (const group of data.athletes || []) {
    for (const p of group.items || []) {
      const name = p.displayName || p.fullName || "";
      if (name && p.id) map.set(keyOf(name), String(p.id));
    }
  }
  return map;
}

export async function gameScorers(away: string, home: string) {
  const want = new Map([away, home].map((t) => [NFL[t] || t, t]));
  const [rows, awayIds, homeIds] = await Promise.all([
    load(),
    rosterIds(NFL[away] || away),
    rosterIds(NFL[home] || home),
  ]);
  const ids = new Map([...awayIds, ...homeIds]);
  const players: Scorer[] = rows
    .filter((r) => want.has(r.team))
    .map((r) => {
      const weeks = [...r.weeks].sort((a, b) => a.week - b.week);
      const total = weeks.reduce((s, w) => s + w.td, 0);
      return {
        name: r.name,
        team: want.get(r.team) || r.team,
        pos: r.pos,
        id: ids.get(keyOf(r.name)) || "",
        rec: weeks.reduce((s, w) => s + w.rec, 0),
        rush: weeks.reduce((s, w) => s + w.rush, 0),
        catches: weeks.reduce((s, w) => s + w.catches, 0),
        pass: weeks.reduce((s, w) => s + w.pass, 0),
        passTd: weeks.reduce((s, w) => s + w.passTd, 0),
        total,
        scored: weeks.filter((w) => w.td > 0).length,
        weeks,
      };
    })
    .filter((p) => p.rec > 0 || p.rush > 0 || p.catches > 0 || p.pass > 0 || p.passTd > 0 || p.total > 0)
    .sort((a, b) => b.rec - a.rec || a.name.localeCompare(b.name));
  return {
    source: "nflverse 2026. A week with no row is missing, not a zero. Lines are research bars, not sportsbook prices.",
    players,
  };
}
