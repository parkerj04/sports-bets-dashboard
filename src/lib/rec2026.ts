import zlib from "zlib";

const URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz";

export type Catch = {
  week: string; team: string; def: string; name: string; loc: string; length: string;
  air: number | null; yards: number | null; yac: number | null; td: boolean; desc: string;
  qtr: string; time: string; down: string; togo: string; from: string; to: string; x: number | null; concept: string;
};

function col(header: string[], name: string) { return header.indexOf(name); }

function endSpot(desc: string, team: string, def: string) {
  const m = desc.match(/\b(?:to|at|ob at)\s+([A-Z]{2,3})\s+(\d{1,2})\b/);
  if (!m) return { to: "", x: null as number | null };
  const side = m[1];
  const yard = Number(m[2]);
  const x = side === team ? yard : side === def ? 100 - yard : null;
  return { to: `${side} ${yard}`, x };
}

function concept(loc: string, length: string, air: number | null, yac: number | null) {
  const lane = loc || "unknown side";
  const depth = length === "deep" ? "deep" : air != null && air <= 3 ? "quick" : "short";
  const after = yac != null && yac >= 10 ? ", with yards after the catch" : "";
  return `${depth} ${lane}${after}. Read from location and air yards, not film.`;
}

export async function catches2026(teams: string[]) {
  const res = await fetch(URL, { next: { revalidate: 3600 } });
  if (!res.ok) return { source: "2026 play-by-play file did not load.", receptions: 0, players: [] };
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const i = {
    week: col(header, "week"), team: col(header, "posteam"), def: col(header, "defteam"),
    name: col(header, "receiver_player_name"), complete: col(header, "complete_pass"),
    loc: col(header, "pass_location"), length: col(header, "pass_length"),
    air: col(header, "air_yards"), yards: col(header, "yards_gained"), yac: col(header, "yards_after_catch"),
    td: col(header, "touchdown"), desc: col(header, "desc"), qtr: col(header, "qtr"),
    time: col(header, "time"), yrdln: col(header, "yrdln"), down: col(header, "down"), togo: col(header, "ydstogo"),
  };
  const want = new Set(teams.map((t) => t.toUpperCase()));
  const grouped = new Map<string, Catch[]>();
  let receptions = 0;
  const weeks = new Set<string>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = split(line);
    if (cells[i.complete] !== "1") continue;
    receptions += 1;
    if (cells[i.week]) weeks.add(cells[i.week]);
    const team = cells[i.team];
    if (!want.has(team)) continue;
    const name = cells[i.name];
    if (!name) continue;
    const desc = cells[i.desc] || "";
    const spot = endSpot(desc, team, cells[i.def]);
    const air = Number(cells[i.air]);
    const yards = Number(cells[i.yards]);
    const yac = Number(cells[i.yac]);
    const loc = cells[i.loc] || "";
    const length = cells[i.length] || "";
    const play: Catch = {
      week: cells[i.week], team, def: cells[i.def], name, loc, length,
      air: Number.isFinite(air) ? air : null,
      yards: Number.isFinite(yards) ? yards : null,
      yac: Number.isFinite(yac) ? yac : null,
      td: cells[i.td] === "1", desc: desc.slice(0, 160),
      qtr: cells[i.qtr], time: cells[i.time], down: cells[i.down], togo: cells[i.togo],
      from: cells[i.yrdln], to: spot.to, x: spot.x,
      concept: concept(loc, length, Number.isFinite(air) ? air : null, Number.isFinite(yac) ? yac : null),
    };
    const key = `${team}|${name}`;
    const arr = grouped.get(key) || [];
    arr.push(play);
    grouped.set(key, arr);
  }
  const players = Array.from(grouped.entries()).map(([, plays]) => ({
    name: plays[0].name, team: plays[0].team, rec: plays.length,
    yards: Math.round(plays.reduce((s, p) => s + (p.yards || 0), 0)),
    td: plays.filter((p) => p.td).length,
    spots: [],
    recent: plays.slice(),
  })).sort((a, b) => b.rec - a.rec);
  return {
    source: `nflverse 2026 play-by-play. ${receptions} completed passes, weeks ${Array.from(weeks).sort((a, b) => Number(a) - Number(b)).join(", ")}. Down and distance are from the play. Coverage is not charted in this file.`,
    receptions, players,
  };
}

function split(line: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === "\"") { q = !q; continue; }
    if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}
