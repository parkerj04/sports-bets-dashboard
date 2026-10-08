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
      const rankRaw = ranks.get(`${mine}|${player.pos}|${player.name}|${stat}`);
      const rank = rankRaw ? Math.min(rankRaw, 3) : null;
      const values = weeksPlayed.map((w) => weekStat(w, market));
      const rate = values.reduce((a, b) => a + b, 0) / n;
      const last = values.slice(-5);
      const recent = last.reduce((a, b) => a + b, 0) / last.length;
      const usual = rank ? mean(league.get(`${player.pos}|${stat}|${rank}|${market}`)) : 0;
      const allowed = rank ? defense.get(`${foeFile}|${player.pos}|${stat}|${rank}|${market}`) : undefined;
      const oppPer = mean(allowed);
      const gap = allowed && allowed.length >= 4 && usual ? oppPer - usual : 0;
      const value = tenth(Math.max(0, rate + gap));
      const club = CLUB[foe] || foe;
      const job = rank ? roleName(player.pos, rank) : "this player";
      const matchup = !rank
        ? "The 2026 yard rank is not on file, so no defense is applied."
        : !allowed || allowed.length < 4
          ? `${club} have ${allowed?.length || 0} games on file against ${job}. That is under 4, so the defense is not applied.`
          : `${club} have allowed ${tenth(oppPer).toFixed(1)} a game to ${job} in ${allowed.length} games. A normal defense has allowed ${tenth(usual).toFixed(1)}. The difference, ${tenth(gap).toFixed(1)}, is the whole adjustment.`;
      const leanCut = market === "td" || market === "passTd" ? 0.1 : market === "catches" ? 0.3 : 5;
      const call = !rank || !allowed || allowed.length < 4
        ? `No team lean against the ${club}.`
        : gap >= leanCut
          ? `Leans over against the ${club}.`
          : gap <= -leanCut
            ? `Leans under against the ${club}.`
            : `No clear lean against the ${club}.`;
      const total = values.reduce((a, b) => a + b, 0);
      const spike = Math.max(...values);
      const spikeNote = spike > 0 && spike * 2 > total
        ? ` One game was ${tenth(spike).toFixed(market === "td" || market === "passTd" ? 0 : 1)} of the ${tenth(total).toFixed(market === "td" || market === "passTd" ? 0 : 1)} on the log.`
        : "";
      models[market] = {
        value,
        text: `${call} ${player.name} is at ${tenth(rate).toFixed(1)} ${UNIT[market]} per game over ${n} games in 2026${gap ? `, and the defense gap of ${tenth(gap).toFixed(1)} is added` : ""}. The last ${last.length} average ${tenth(recent).toFixed(1)} and are not mixed in. ${matchup}${spikeNote} A yard move under 5, or a catch move under 0.3, is not a lean. Not a book price.`,
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
    source: "nflverse 2026. The number is the player's own per-game average. A defense is added only when it has at least 4 games against that role, and the add is the difference versus a normal defense. The last five are shown and not averaged in. Not a sportsbook price.",
    players,
  };
}
