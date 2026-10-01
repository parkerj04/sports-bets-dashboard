import zlib from "zlib";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };
const url = (year: number) => `https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_${year}.csv.gz`;

export type Prop = {
  name: string; team: string; opp: string; market: string; line: number; last5: number[]; hit: string;
  prior: { week: string; value: number }[]; why: string;
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
function lineFor(market: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  if (market === "Receptions") return Math.max(2, Math.floor(mid));
  if (market === "Pass yards") return Math.max(150, Math.floor(mid / 10) * 10);
  return Math.max(10, Math.floor(mid / 5) * 5);
}

async function load(year: number) {
  const res = await fetch(url(year), { next: { revalidate: 3600 } });
  if (!res.ok) return [] as { market: string; name: string; team: string; def: string; week: string; n: number }[];
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const col = (n: string) => header.indexOf(n);
  const i = {
    week: col("week"), team: col("posteam"), def: col("defteam"),
    receiver: col("receiver_player_name"), recYds: col("receiving_yards"), complete: col("complete_pass"),
    passer: col("passer_player_name"), passYds: col("passing_yards"),
  };
  const map = new Map<string, { market: string; name: string; team: string; def: string; week: string; n: number }>();
  const add = (market: string, name: string, team: string, def: string, week: string, n: number) => {
    if (!name || !team || !week) return;
    const key = `${market}|${team}|${name}|${week}|${def}`;
    const row = map.get(key) || { market, name, team, def, week, n: 0 };
    row.n += n; map.set(key, row);
  };
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const c = split(line);
    if (c[i.complete] === "1") {
      add("Receptions", c[i.receiver], c[i.team], c[i.def], c[i.week], 1);
      add("Receiving yards", c[i.receiver], c[i.team], c[i.def], c[i.week], Number(c[i.recYds]) || 0);
    }
    const py = Number(c[i.passYds]);
    if (c[i.passer] && Number.isFinite(py) && py !== 0) add("Pass yards", c[i.passer], c[i.team], c[i.def], c[i.week], py);
  }
  return [...map.values()];
}

export async function recProps(away: string, home: string): Promise<Prop[]> {
  const a = canon(away.toUpperCase());
  const h = canon(home.toUpperCase());
  const [now, prior] = await Promise.all([load(2026), load(2025)]);
  const sides = [{ team: a, opp: h }, { team: h, opp: a }];
  const markets = ["Receptions", "Receiving yards", "Pass yards"];
  const out: Prop[] = [];
  for (const side of sides) {
    for (const market of markets) {
      const names = [...new Set(now.filter((r) => r.team === side.team && r.market === market).map((r) => r.name))];
      for (const name of names) {
        const season = now.filter((r) => r.team === side.team && r.market === market && r.name === name).sort((x, y) => Number(x.week) - Number(y.week));
        if (season.length < 3) continue;
        const line = lineFor(market, season.map((r) => r.n));
        const last5 = season.slice(-5).map((r) => r.n);
        const hits = last5.filter((n) => n >= line).length;
        if (hits < 3) continue;
        const old = prior.filter((r) => r.team === side.team && r.market === market && r.name === name && r.def === side.opp);
        out.push({
          name, team: side.team, opp: side.opp, market, line, last5, hit: `${hits}/${last5.length}`,
          prior: old.map((r) => ({ week: r.week, value: r.n })),
          why: `${hits} of the last ${last5.length} cleared ${line} ${market.toLowerCase()}. Against ${side.opp} in 2025: ${old.length ? old.map((r) => `week ${r.week} ${r.n}`).join(", ") : "no game in the 2025 file"}. Line is his own median, rounded. Not a book number.`,
        });
      }
    }
  }
  return out.sort((x, y) => Number(y.hit.split("/")[0]) - Number(x.hit.split("/")[0]) || y.prior.length - x.prior.length).slice(0, 6);
}
