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

function roleKey(pos: string, market: ModelMarket): "rec" | "rush" | "pass" {
  if (pos === "QB") return "pass";
  if (pos === "RB" && (market === "rush" || market === "td")) return "rush";
  return "rec";
}

function roleName(pos: string, rank: number) {
  const slot = Math.min(rank, 3);
  if (pos === "QB") return slot === 1 ? "the starting quarterback" : "a backup quarterback";
  if (pos === "RB") return slot === 1 ? "the lead back" : slot === 2 ? "the second back" : "a depth back";
  if (pos === "TE") return slot === 1 ? "the top tight end" : "a second tight end";
  return slot === 1 ? "the top receiver" : slot === 2 ? "the second receiver" : "a depth receiver";
}

function protect(rows: Raw[], away: string, home: string) {
  type App = ScorerWeek & { team: string; pos: string; name: string };
  const apps: App[] = [];
  for (const r of rows) {
    for (const w of r.weeks) apps.push({ ...w, team: r.team, pos: r.pos, name: r.name });
  }
  const season = new Map<string, { pos: string; rec: number; rush: number; pass: number }>();
  for (const a of apps) {
    const key = `${a.team}|${a.pos}|${a.name}`;
    const cur = season.get(key) || { pos: a.pos, rec: 0, rush: 0, pass: 0 };
    cur.rec += a.rec;
    cur.rush += a.rush;
    cur.pass += a.pass;
    season.set(key, cur);
  }
  const ranks = new Map<string, number>();
  for (const stat of ["rec", "rush", "pass"] as const) {
    const groups = new Map<string, { key: string; value: number }[]>();
    for (const [key, cur] of season) {
      const [team, pos] = key.split("|");
      const g = groups.get(`${team}|${pos}|${stat}`) || [];
      g.push({ key, value: cur[stat] });
      groups.set(`${team}|${pos}|${stat}`, g);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => b.value - a.value);
      list.forEach((item, i) => ranks.set(`${item.key}|${stat}`, i + 1));
    }
  }
  const league = new Map<string, number[]>();
  const defense = new Map<string, number[]>();
  const weeks = new Map<string, App[]>();
  for (const a of apps) {
    const g = weeks.get(`${a.team}|${a.week}|${a.pos}`) || [];
    g.push(a);
    weeks.set(`${a.team}|${a.week}|${a.pos}`, g);
  }
  for (const group of weeks.values()) {
    for (const stat of ["rec", "rush", "pass"] as const) {
      const ordered = [...group].sort((a, b) => b[stat] - a[stat]);
      ordered.slice(0, 3).forEach((a, i) => {
        const rank = i + 1;
        for (const market of MODEL_MARKETS) {
          if (roleKey(a.pos, market) !== stat) continue;
          const value = weekStat(a, market);
          const lkey = `${a.pos}|${stat}|${rank}|${market}`;
          const l = league.get(lkey) || [];
          l.push(value);
          league.set(lkey, l);
          const dkey = `${a.opp}|${lkey}`;
          const d = defense.get(dkey) || [];
          d.push(value);
          defense.set(dkey, d);
        }
      });
    }
  }
  const mean = (xs?: number[]) => (xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return (player: { name: string; pos: string; team: string }, weeksPlayed: ScorerWeek[]) => {
    const foe = player.team === away ? home : away;
    const foeFile = NFL[foe] || foe;
    const mine = NFL[player.team] || player.team;
    const models: Scorer["models"] = {};
    const n = weeksPlayed.length;
    if (!n) return models;
    for (const market of MODEL_MARKETS) {
      const stat = roleKey(player.pos, market);
      const rank = Math.min(ranks.get(`${mine}|${player.pos}|${player.name}|${stat}`) || 3, 3);
      const values = weeksPlayed.map((w) => weekStat(w, market));
      const rate = values.reduce((a, b) => a + b, 0) / n;
      const usual = mean(league.get(`${player.pos}|${stat}|${rank}|${market}`));
      const allowed = defense.get(`${foeFile}|${player.pos}|${stat}|${rank}|${market}`);
      const oppPer = mean(allowed);
      const shortLog = n < 3;
      const base = shortLog ? (rate + usual) / 2 : rank === 1 ? rate : rate * 0.7 + usual * 0.3;
      const gap = allowed && allowed.length >= 3 && usual ? oppPer - usual : 0;
      const cap = market === "td" || market === "passTd" ? 0.5 : Math.max(usual * 0.25, 0.5);
      const move = Math.max(-cap, Math.min(cap, gap));
      const value = tenth(Math.max(0, base + move));
      const club = CLUB[foe] || foe;
      const job = roleName(player.pos, rank);
      const matchup = !allowed || allowed.length < 3
        ? `${club} do not have 3 games on file against ${job}, so the defense does not move the number.`
        : move > 0.05 && value > rate
          ? `${club} have allowed ${tenth(oppPer).toFixed(1)} a game to ${job}. A normal defense allows ${tenth(usual).toFixed(1)}. That is why the number clears that rate.`
          : move < -0.05 && value < rate
            ? `${club} have allowed ${tenth(oppPer).toFixed(1)} a game to ${job}. A normal defense allows ${tenth(usual).toFixed(1)}. That is why the number sits under that rate.`
            : `${club} have allowed ${tenth(oppPer).toFixed(1)} a game to ${job}, close to the normal ${tenth(usual).toFixed(1)}, so the matchup barely moves it.`;
      const total = values.reduce((a, b) => a + b, 0);
      const spike = Math.max(...values);
      const against = (market === "td" || market === "passTd") && spike >= 2 && spike * 2 > total
        ? ` One game was ${tenth(spike).toFixed(0)} of the ${tenth(total).toFixed(0)} scores.`
        : "";
      const sample = shortLog ? " The log is under 3 games, so it is pulled halfway to the normal player in that role." : "";
      models[market] = {
        value,
        text: `${player.name} is ${job} and projects to ${value.toFixed(1)} ${UNIT[market]} against the ${club}. The 2026 rate is ${tenth(rate).toFixed(1)} over ${n} games. ${matchup}${sample}${against} Not a book price.`,
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
    source: "nflverse 2026. The model starts at the player's own rate, then adds the gap between what this defense allows that role and what a normal defense allows. A top receiver is not pulled down to the backup average. Not a sportsbook price.",
    players,
  };
}
