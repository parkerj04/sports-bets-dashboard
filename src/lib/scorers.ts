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

const MODEL_MARKETS = ["rec", "catches", "rush", "pass", "passTd", "td"] as const;
type ModelMarket = (typeof MODEL_MARKETS)[number];

const UNIT: Record<ModelMarket, string> = {
  rec: "receiving yards",
  catches: "receptions",
  rush: "rushing yards",
  pass: "passing yards",
  passTd: "passing touchdowns",
  td: "anytime touchdowns",
};

const POS_WORD: Record<string, string> = {
  QB: "Quarterbacks",
  RB: "Running backs",
  WR: "Wide receivers",
  TE: "Tight ends",
};

const CLUB: Record<string, string> = {
  ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills", CAR: "Panthers", CHI: "Bears",
  CIN: "Bengals", CLE: "Browns", DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers",
  HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs", LV: "Raiders", LAC: "Chargers",
  LAR: "Rams", LA: "Rams", MIA: "Dolphins", MIN: "Vikings", NE: "Patriots", NO: "Saints",
  NYG: "Giants", NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SF: "49ers", SEA: "Seahawks",
  TB: "Buccaneers", TEN: "Titans", WAS: "Commanders", WSH: "Commanders",
};

function tenth(n: number) {
  return Math.round(n * 10) / 10;
}

function weekStat(w: ScorerWeek, market: ModelMarket) {
  return w[market];
}

function protect(rows: Raw[], away: string, home: string) {
  const sums = new Map<string, { pos: string; n: number; sum: Record<ModelMarket, number> }>();
  const bucket = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.pos}|${r.team}|${r.name}`;
    const cur = sums.get(key) || { pos: r.pos, n: 0, sum: { rec: 0, catches: 0, rush: 0, pass: 0, passTd: 0, td: 0 } };
    for (const w of r.weeks) {
      cur.n += 1;
      for (const market of MODEL_MARKETS) {
        const value = weekStat(w, market);
        cur.sum[market] += value;
        const slot = `${w.opp}|${w.week}|${r.pos}|${market}`;
        bucket.set(slot, (bucket.get(slot) || 0) + value);
      }
    }
    sums.set(key, cur);
  }
  const priorSum: Record<string, Record<ModelMarket, number>> = {};
  const priorN: Record<string, number> = {};
  for (const cur of sums.values()) {
    if (cur.n < 3) continue;
    priorN[cur.pos] = (priorN[cur.pos] || 0) + 1;
    const bag = priorSum[cur.pos] || { rec: 0, catches: 0, rush: 0, pass: 0, passTd: 0, td: 0 };
    for (const market of MODEL_MARKETS) bag[market] += cur.sum[market] / cur.n;
    priorSum[cur.pos] = bag;
  }
  const league = new Map<string, number[]>();
  const opp = new Map<string, number[]>();
  for (const [slot, value] of bucket) {
    const [defense, , pos, market] = slot.split("|");
    const key = `${pos}|${market}`;
    const list = league.get(key) || [];
    list.push(value);
    league.set(key, list);
    const okey = `${defense}|${key}`;
    const olist = opp.get(okey) || [];
    olist.push(value);
    opp.set(okey, olist);
  }
  const mean = (xs?: number[]) => (xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return (player: { name: string; pos: string; team: string }, weeks: ScorerWeek[]) => {
    const foe = player.team === away ? home : away;
    const foeFile = NFL[foe] || foe;
    const models: Scorer["models"] = {};
    const n = weeks.length;
    if (!n) return models;
    for (const market of MODEL_MARKETS) {
      const rate = weeks.reduce((s, w) => s + weekStat(w, market), 0) / n;
      const samples = priorN[player.pos] || 0;
      if (!samples) continue;
      const prior = priorSum[player.pos][market] / samples;
      const shrunk = (n * rate + 3 * prior) / (n + 3);
      const oppVals = opp.get(`${foeFile}|${player.pos}|${market}`);
      const leagueVals = league.get(`${player.pos}|${market}`);
      const oppPer = mean(oppVals);
      const leaguePer = mean(leagueVals);
      const raw = leaguePer ? oppPer / leaguePer : 1;
      const short = !oppVals || oppVals.length < 3;
      const factor = short ? 1 : Math.min(1.15, Math.max(0.85, raw));
      const value = tenth(shrunk * factor);
      const club = CLUB[foe] || foe;
      const move = short
        ? `${club} have fewer than 3 games on file at this position, so the defense does not move the number.`
        : `${club} have allowed ${tenth(oppPer).toFixed(1)} per game to the position. A typical defense game is ${tenth(leaguePer).toFixed(1)}. That ratio is capped at 15 percent, so the factor used is ${factor.toFixed(2)}.`;
      models[market] = {
        value,
        text: `${player.name} projects to ${value.toFixed(1)} ${UNIT[market]} against the ${club}. The 2026 rate is ${tenth(rate).toFixed(1)} over ${n} games. ${POS_WORD[player.pos] || "Players"} with at least 3 games average ${tenth(prior).toFixed(1)}. ${move} Not a book price.`,
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
  const score = protect(rows, away, home);
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
        models: score({ name: r.name, pos: r.pos, team: want.get(r.team) || r.team }, weeks),
      };
    })
    .filter((p) => p.rec > 0 || p.rush > 0 || p.catches > 0 || p.pass > 0 || p.passTd > 0 || p.total > 0)
    .sort((a, b) => b.rec - a.rec || a.name.localeCompare(b.name));
  return {
    source: "nflverse 2026. The protected model pulls a short log toward players with at least 3 games, then caps the opponent at 15 percent. Not a sportsbook price.",
    players,
  };
}
