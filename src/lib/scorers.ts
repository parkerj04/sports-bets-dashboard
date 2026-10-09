import { unstable_cache } from "next/cache";

const FILE = "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv";
const SCHED = "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";
const NFL: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export type ScorerWeek = { week: number; date: string; td: number; rec: number; rush: number; catches: number; pass: number; passTd: number; opp: string };
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
  models: Partial<Record<"rec" | "catches" | "rush" | "pass" | "passTd" | "td", { value: number; text: string }>>;
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
  const [res, sched] = await Promise.all([fetch(FILE), fetch(SCHED)]);
  if (!res.ok) return [];
  const days = new Map<string, string>();
  if (sched.ok) {
    const book = (await sched.text()).split("\n");
    const head = split(book[0]);
    const id = head.indexOf("game_id");
    const day = head.indexOf("gameday");
    const season = head.indexOf("season");
    for (const line of book.slice(1)) {
      if (!line) continue;
      const c = split(line);
      if (c[season] !== "2026" || !c[id] || !c[day]) continue;
      days.set(c[id], c[day]);
    }
  }
  const text = await res.text();
  const lines = text.split("\n");
  const header = split(lines[0]);
  const col = (name: string) => header.indexOf(name);
  const i = {
    name: col("player_display_name"), team: col("team"), pos: col("position"),
    type: col("season_type"), week: col("week"), opp: col("opponent_team"), game: col("game_id"),
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
    row.weeks.push({
      week: Number(c[i.week]) || 0,
      date: days.get(c[i.game]) || "",
      td, rec, rush, catches, pass, passTd,
      opp: c[i.opp] || "",
    });
    grouped.set(key, row);
  }
  return Array.from(grouped.values());
}, ["nfl-player-weeks-2026-dates"], { revalidate: 3600 });

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

const MODEL_MARKETS = ["rec", "catches", "rush", "pass", "passTd", "td"] as const;
type ModelMarket = (typeof MODEL_MARKETS)[number];

const UNIT: Record<ModelMarket, string> = {
  rec: "rec yds",
  catches: "receptions",
  rush: "rush yds",
  pass: "pass yds",
  passTd: "pass TD",
  td: "anytime TD",
};

function tenth(n: number) {
  return Math.round(n * 10) / 10;
}
function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function weekStat(w: ScorerWeek, market: ModelMarket) {
  return w[market];
}

function card(rows: Raw[]) {
  const allowed = new Map<string, number[]>();
  for (const row of rows) {
    for (const w of row.weeks) {
      for (const market of MODEL_MARKETS) {
        const key = `${w.opp}|${row.pos}|${market}`;
        const list = allowed.get(key) || [];
        list.push(weekStat(w, market));
        allowed.set(key, list);
      }
    }
  }
  function rank(opp: string, pos: string, market: ModelMarket) {
    const mine = mean(allowed.get(`${opp}|${pos}|${market}`) || []);
    const teams = new Map<string, number>();
    for (const [key, list] of allowed) {
      const [team, p, m] = key.split("|");
      if (p === pos && m === market) teams.set(team, mean(list));
    }
    const ordered = [...teams.values()].sort((a, b) => a - b);
    const place = ordered.findIndex((n) => n >= mine) + 1;
    return { mine, place, of: ordered.length };
  }
  return (player: { name: string; pos: string }, weeksPlayed: ScorerWeek[], foe: string) => {
    const models: Scorer["models"] = {};
    if (!weeksPlayed.length) return models;
    for (const market of MODEL_MARKETS) {
      const values = weeksPlayed.map((w) => weekStat(w, market));
      const last3 = values.slice(-3);
      const season = mean(values);
      const recent = mean(last3);
      const line = tenth(season);
      const clears = values.filter((n) => n > line).length;
      const recentClears = last3.filter((n) => n > line).length;
      const def = rank(foe, player.pos, market);
      const log = weeksPlayed.slice(-5).map((w) => `${w.opp} ${tenth(weekStat(w, market))}`).join(", ");
      models[market] = {
        value: tenth(recent),
        text: [
          `${player.name} ${UNIT[market]}. This week's number is not on the card, so the line used is his own season average, ${line}.`,
          `Last 3 / season: ${tenth(recent)} / ${tenth(season)}.`,
          `Over that average: last 3 ${recentClears}/${last3.length}, season ${clears}/${values.length}.`,
          `Log: ${log}. A zero is the defense he drew, not the rate.`,
          `${foe} has allowed ${tenth(def.mine)} ${UNIT[market]} a game to ${player.pos}s, ${def.place} of ${def.of}, fewest first. Position bucket, not the man on him.`,
          `Snap share, target share, and implied points are not on this card yet.`,
        ].join(" "),
      };
    }
    return models;
  };
}

export async function gameScorers(away: string, home: string) {
  const want = new Map([away, home].map((t) => [NFL[t] || t, t]));
  const [rows, awayIds, homeIds] = await Promise.all([
    load(),
    rosterIds(NFL[away] || away),
    rosterIds(NFL[home] || home),
  ]);
  const ids = new Map([...awayIds, ...homeIds]);
  const score = card(rows);
  const players: Scorer[] = rows
    .filter((r) => want.has(r.team))
    .map((r) => {
      const weeks = [...r.weeks].sort((a, b) => a.week - b.week);
      const total = weeks.reduce((s, w) => s + w.td, 0);
      const team = want.get(r.team) || r.team;
      const foe = team === away ? home : away;
      return {
        name: r.name,
        team,
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
        models: score({ name: r.name, pos: r.pos }, weeks, foe),
      };
    })
    .filter((p) => p.rec > 0 || p.rush > 0 || p.catches > 0 || p.pass > 0 || p.passTd > 0 || p.total > 0)
    .sort((a, b) => b.rec - a.rec || a.name.localeCompare(b.name));
  return {
    source: "nflverse 2026. Last 3 against season. Defense number is what that team allowed to the position. Not a book line.",
    players,
  };
}
