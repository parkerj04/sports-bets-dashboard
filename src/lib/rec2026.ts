import zlib from "zlib";

const URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz";

export type Catch = {
  week: string;
  team: string;
  def: string;
  name: string;
  loc: string;
  length: string;
  air: number | null;
  yards: number | null;
  td: boolean;
  desc: string;
};

function col(header: string[], name: string) {
  return header.indexOf(name);
}

export async function catches2026(teams: string[]): Promise<{ source: string; receptions: number; players: { name: string; team: string; rec: number; yards: number; td: number; spots: { loc: string; length: string; n: number }[]; recent: Catch[] }[] }> {
  const res = await fetch(URL, { next: { revalidate: 21600 } });
  if (!res.ok) return { source: "2026 play-by-play file did not load.", receptions: 0, players: [] };
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const i = {
    week: col(header, "week"),
    team: col(header, "posteam"),
    def: col(header, "defteam"),
    name: col(header, "receiver_player_name"),
    complete: col(header, "complete_pass"),
    loc: col(header, "pass_location"),
    length: col(header, "pass_length"),
    air: col(header, "air_yards"),
    yards: col(header, "yards_gained"),
    td: col(header, "touchdown"),
    desc: col(header, "desc"),
  };
  const want = new Set(teams.map((t) => t.toUpperCase()));
  const grouped = new Map<string, Catch[]>();
  let receptions = 0;
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = split(line);
    if (cells[i.complete] !== "1") continue;
    receptions += 1;
    const team = cells[i.team];
    if (!want.has(team)) continue;
    const name = cells[i.name];
    if (!name) continue;
    const air = Number(cells[i.air]);
    const yards = Number(cells[i.yards]);
    const play: Catch = {
      week: cells[i.week],
      team,
      def: cells[i.def],
      name,
      loc: cells[i.loc] || "",
      length: cells[i.length] || "",
      air: Number.isFinite(air) ? air : null,
      yards: Number.isFinite(yards) ? yards : null,
      td: cells[i.td] === "1",
      desc: (cells[i.desc] || "").slice(0, 160),
    };
    const key = `${team}|${name}`;
    const arr = grouped.get(key) || [];
    arr.push(play);
    grouped.set(key, arr);
  }
  const players = Array.from(grouped.entries()).map(([, plays]) => {
    const spots = new Map<string, number>();
    for (const p of plays) {
      if (!p.loc || !p.length) continue;
      const k = `${p.loc}|${p.length}`;
      spots.set(k, (spots.get(k) || 0) + 1);
    }
    return {
      name: plays[0].name,
      team: plays[0].team,
      rec: plays.length,
      yards: Math.round(plays.reduce((s, p) => s + (p.yards || 0), 0)),
      td: plays.filter((p) => p.td).length,
      spots: Array.from(spots.entries()).map(([k, n]) => {
        const [loc, length] = k.split("|");
        return { loc, length, n };
      }).sort((a, b) => b.n - a.n),
      recent: plays.slice(-4).reverse(),
    };
  }).sort((a, b) => b.rec - a.rec);
  return {
    source: `nflverse 2026 play-by-play. ${receptions} completed passes in weeks 1-3. A dot is only drawn when that play has a left, middle, or right location.`,
    receptions,
    players,
  };
}

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
