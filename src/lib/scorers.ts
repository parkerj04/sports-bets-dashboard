import { unstable_cache } from "next/cache";

const SCHED = "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";
const NFL: Record<string, string> = { WSH: "WAS", LAR: "LA" };
const SEASONS = [2025, 2026];

export type ScorerWeek = { season: number; week: number; date: string; td: number; rec: number; rush: number; catches: number; pass: number; passTd: number; opp: string };
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

type Raw = { name: string; team: string; pos: string; latest: number; weeks: ScorerWeek[] };
type Line = { away: string; home: string; spread: number; total: number };

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

function weekFile(year: number) {
  return `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${year}.csv`;
}

const load = unstable_cache(async (): Promise<Raw[]> => {
  const [sched, ...stats] = await Promise.all([fetch(SCHED), ...SEASONS.map((year) => fetch(weekFile(year)))]);
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
      if ((c[season] !== "2025" && c[season] !== "2026") || !c[id] || !c[day]) continue;
      days.set(c[id], c[day]);
    }
  }
  const grouped = new Map<string, Raw>();
  for (const res of stats) {
    if (!res.ok) continue;
    const lines = (await res.text()).split("\n");
    const header = split(lines[0]);
    const col = (name: string) => header.indexOf(name);
    const i = {
      id: col("player_id"), name: col("player_display_name"), team: col("team"), pos: col("position"),
      season: col("season"), type: col("season_type"), week: col("week"), opp: col("opponent_team"), game: col("game_id"),
      rushTd: col("rushing_tds"), recTd: col("receiving_tds"),
      rushYds: col("rushing_yards"), recYds: col("receiving_yards"),
      catches: col("receptions"), passYds: col("passing_yards"), passTd: col("passing_tds"),
    };
    for (const line of lines.slice(1)) {
      if (!line) continue;
      const c = split(line);
      if (c[i.type] !== "REG") continue;
      if (!["WR", "TE", "RB", "QB"].includes(c[i.pos])) continue;
      const season = Number(c[i.season]) || 0;
      if (!SEASONS.includes(season)) continue;
      const week = Number(c[i.week]) || 0;
      const td = (Number(c[i.rushTd]) || 0) + (Number(c[i.recTd]) || 0);
      const rec = Number(c[i.recYds]) || 0;
      const rush = Number(c[i.rushYds]) || 0;
      const catches = Number(c[i.catches]) || 0;
      const pass = Number(c[i.passYds]) || 0;
      const passTd = Number(c[i.passTd]) || 0;
      const key = c[i.id] || c[i.name];
      if (!key) continue;
      const row = grouped.get(key) || { name: c[i.name], team: c[i.team], pos: c[i.pos], latest: 0, weeks: [] };
      const stamp = season * 100 + week;
      if (stamp >= row.latest) {
        row.latest = stamp;
        row.team = c[i.team];
        row.pos = c[i.pos];
        row.name = c[i.name] || row.name;
      }
      row.weeks.push({
        season, week, date: days.get(c[i.game]) || "",
        td, rec, rush, catches, pass, passTd,
        opp: c[i.opp] || "",
      });
      grouped.set(key, row);
    }
  }
  for (const row of grouped.values()) row.weeks.sort((a, b) => a.season - b.season || a.week - b.week);
  return Array.from(grouped.values()).filter((row) => row.weeks.some((week) => week.season === 2026));
}, ["nfl-player-weeks-2025-2026"], { revalidate: 3600 });

async function lines(): Promise<Line[]> {
  const res = await fetch(SCHED, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const book = (await res.text()).split("\n");
  const head = split(book[0]);
  const col = (name: string) => head.indexOf(name);
  const season = col("season");
  const away = col("away_team");
  const home = col("home_team");
  const spread = col("spread_line");
  const total = col("total_line");
  const out: Line[] = [];
  for (const line of book.slice(1)) {
    if (!line) continue;
    const c = split(line);
    if (c[season] !== "2026") continue;
    const sp = Number(c[spread]);
    const tot = Number(c[total]);
    if (!c[away] || !c[home] || !Number.isFinite(sp) || !Number.isFinite(tot)) continue;
    out.push({ away: c[away], home: c[home], spread: sp, total: tot });
  }
  return out;
}

function implied(row: Line | undefined, team: string) {
  if (!row) return "Implied points not on the schedule.";
  const homePts = (row.total - row.spread) / 2;
  const awayPts = row.total - homePts;
  const pts = team === row.home ? homePts : awayPts;
  return `Implied points ${tenth(pts)} (spread ${row.spread}, total ${row.total}).`;
}

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
      if (w.season !== 2026) continue;
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
  return (player: { name: string; pos: string }, weeksPlayed: ScorerWeek[], foe: string, script: string) => {
    const models: Scorer["models"] = {};
    const seasonWeeks = weeksPlayed.filter((w) => w.season === 2026);
    const last10 = weeksPlayed.slice(-10);
    const base = seasonWeeks.length ? seasonWeeks : last10;
    if (!base.length) return models;
    for (const market of MODEL_MARKETS) {
      const values = base.map((w) => weekStat(w, market));
      const recentValues = last10.map((w) => weekStat(w, market));
      const season = mean(values);
      const recent = mean(recentValues);
      const line = tenth(season);
      const clears = values.filter((n) => n > line).length;
      const recentClears = recentValues.filter((n) => n > line).length;
      const def = rank(foe, player.pos, market);
      const log = last10.map((w) => `${w.season === 2026 ? "" : `${w.season} `}${w.opp} ${tenth(weekStat(w, market))}`).join(", ");
      models[market] = {
        value: tenth(recent),
        text: [
          `${player.name} ${UNIT[market]}. Book prop line is not in this file, so the comparison line is his 2026 average, ${line}.`,
          `Last 10 / 2026: ${tenth(recent)} / ${tenth(season)}.`,
          `Over that 2026 average: last 10 ${recentClears}/${recentValues.length}, 2026 ${clears}/${values.length}.`,
          `Log: ${log}. A zero is the defense he drew, not the rate.`,
          `${foe} has allowed ${tenth(def.mine)} ${UNIT[market]} a game to ${player.pos}s, ${def.place} of ${def.of}, fewest first. Position bucket, not the man on him. 2026 only.`,
          script,
          `Snap share and target share are not on this card yet.`,
        ].join(" "),
      };
    }
    return models;
  };
}

export async function gameScorers(away: string, home: string) {
  const want = new Map([away, home].map((t) => [NFL[t] || t, t]));
  const [rows, awayIds, homeIds, book] = await Promise.all([
    load(),
    rosterIds(NFL[away] || away),
    rosterIds(NFL[home] || home),
    lines(),
  ]);
  const ids = new Map([...awayIds, ...homeIds]);
  const score = card(rows);
  const fileAway = NFL[away] || away;
  const fileHome = NFL[home] || home;
  const row = book.find((g) => (g.away === fileAway && g.home === fileHome) || (g.away === fileHome && g.home === fileAway));
  const players: Scorer[] = rows
    .filter((r) => want.has(r.team))
    .map((r) => {
      const weeks = r.weeks;
      const seasonWeeks = weeks.filter((w) => w.season === 2026);
      const total = seasonWeeks.reduce((s, w) => s + w.td, 0);
      const team = want.get(r.team) || r.team;
      const foe = team === away ? home : away;
      return {
        name: r.name,
        team,
        pos: r.pos,
        id: ids.get(keyOf(r.name)) || "",
        rec: seasonWeeks.reduce((s, w) => s + w.rec, 0),
        rush: seasonWeeks.reduce((s, w) => s + w.rush, 0),
        catches: seasonWeeks.reduce((s, w) => s + w.catches, 0),
        pass: seasonWeeks.reduce((s, w) => s + w.pass, 0),
        passTd: seasonWeeks.reduce((s, w) => s + w.passTd, 0),
        total,
        scored: seasonWeeks.filter((w) => w.td > 0).length,
        weeks,
        models: score({ name: r.name, pos: r.pos }, weeks, foe, implied(row, NFL[team] || team)),
      };
    })
    .filter((p) => p.rec > 0 || p.rush > 0 || p.catches > 0 || p.pass > 0 || p.passTd > 0 || p.total > 0)
    .sort((a, b) => b.rec - a.rec || a.name.localeCompare(b.name));
  return {
    source: "nflverse. L10 is the last 10 games played, and it crosses into 2025 when this season is shorter. The line is the 2026 average. Prop line is not in this file.",
    players,
  };
}
