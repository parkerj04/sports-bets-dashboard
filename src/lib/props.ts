import zlib from "zlib";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };
const url = (year: number) => `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${year}.csv.gz`;

export type Prop = {
  name: string; team: string; opp: string; line: number; last5: number[]; hit: string;
  prior: { week: string; yards: number }[]; why: string;
};

function split(line: string) {
  const out: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur); return out;
}
function canon(t: string) { return FILE[t] || t; }

async function weeks(year: number) {
  const res = await fetch(url(year), { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const col = (n: string) => header.indexOf(n);
  const i = { week: col("week"), team: col("posteam"), def: col("defteam"), name: col("receiver_player_name"), yards: col("receiving_yards"), complete: col("complete_pass") };
  const map = new Map<string, { name: string; team: string; def: string; week: string; yards: number }>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const c = split(line);
    if (c[i.complete] !== "1" || !c[i.name]) continue;
    const key = `${c[i.team]}|${c[i.name]}|${c[i.week]}|${c[i.def]}`;
    const row = map.get(key) || { name: c[i.name], team: c[i.team], def: c[i.def], week: c[i.week], yards: 0 };
    row.yards += Number(c[i.yards]) || 0;
    map.set(key, row);
  }
  return [...map.values()];
}

export async function recProps(away: string, home: string): Promise<Prop[]> {
  const a = canon(away.toUpperCase());
  const h = canon(home.toUpperCase());
  const [now, prior] = await Promise.all([weeks(2026), weeks(2025)]);
  const sides = [{ team: a, opp: h }, { team: h, opp: a }];
  const out: Prop[] = [];
  for (const side of sides) {
    const names = [...new Set(now.filter((r) => r.team === side.team).map((r) => r.name))];
    for (const name of names) {
      const season = now.filter((r) => r.team === side.team && r.name === name).sort((x, y) => Number(x.week) - Number(y.week));
      if (season.length < 3) continue;
      const last5 = season.slice(-5).map((r) => r.yards);
      const hits = last5.filter((y) => y >= 25).length;
      if (hits < 3) continue;
      const old = prior.filter((r) => r.team === side.team && r.name === name && r.def === side.opp);
      const priorYards = old.reduce((s, r) => s + r.yards, 0);
      out.push({
        name, team: side.team, opp: side.opp, line: 25, last5, hit: `${hits}/${last5.length}`,
        prior: old.map((r) => ({ week: r.week, yards: r.yards })),
        why: `${hits} of the last ${last5.length} cleared 25 receiving yards. Against ${side.opp} in 2025: ${old.length ? old.map((r) => `week ${r.week} ${r.yards}`).join(", ") : "no game in the 2025 file"}. ${old.length ? `${priorYards} yards in ${old.length} game${old.length === 1 ? "" : "s"}.` : "No prior meeting to lean on."} Line is 25, an alt shape, not a book number.`,
      });
    }
  }
  return out.sort((x, y) => y.last5.filter((n) => n >= 25).length - x.last5.filter((n) => n >= 25).length).slice(0, 6);
}
