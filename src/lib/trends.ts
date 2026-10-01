import zlib from "zlib";

const URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz";

export type Trend = {
  name: string; team: string; market: string; line: number; last4: string; last5: string; last10: string;
  streak: number; rate: number;
};

function col(header: string[], name: string) { return header.indexOf(name); }
function split(line: string) {
  const out: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === "," && !q) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur); return out;
}
function hit(values: number[], line: number) {
  const last = values.slice(-10);
  const n = (w: number) => { const s = last.slice(-w); return `${s.filter((v) => v > line).length}/${s.length}`; };
  let streak = 0;
  for (let i = values.length - 1; i >= 0; i--) { if (values[i] > line) streak += 1; else break; }
  const sample = last.slice(-5);
  const rate = sample.length ? Math.round(100 * sample.filter((v) => v > line).length / sample.length) : 0;
  return { last4: n(4), last5: n(5), last10: n(10), streak, rate };
}

export async function nflTrends(): Promise<Trend[]> {
  const res = await fetch(URL, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const i = {
    week: col(header, "week"), team: col(header, "posteam"),
    rusher: col(header, "rusher_player_name"), rush: col(header, "rush_attempt"),
    passer: col(header, "passer_player_name"), py: col(header, "passing_yards"),
    receiver: col(header, "receiver_player_name"), complete: col(header, "complete_pass"),
  };
  const weeks = new Map<string, { team: string; market: string; name: string; week: string; n: number }>();
  const add = (market: string, name: string, team: string, week: string, n: number) => {
    if (!name || !team || !week) return;
    const key = `${market}|${team}|${name}|${week}`;
    const row = weeks.get(key) || { team, market, name, week, n: 0 };
    row.n += n; weeks.set(key, row);
  };
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const c = split(line);
    if (c[i.rush] === "1") add("Rush attempts", c[i.rusher], c[i.team], c[i.week], 1);
    if (c[i.complete] === "1") add("Receptions", c[i.receiver], c[i.team], c[i.week], 1);
    const py = Number(c[i.py]);
    if (c[i.passer] && Number.isFinite(py) && py !== 0) add("Pass yards", c[i.passer], c[i.team], c[i.week], py);
  }
  const grouped = new Map<string, number[]>();
  const meta = new Map<string, { name: string; team: string; market: string }>();
  for (const row of weeks.values()) {
    const key = `${row.market}|${row.team}|${row.name}`;
    const arr = grouped.get(key) || [];
    arr.push(row.n); grouped.set(key, arr); meta.set(key, row);
  }
  const out: Trend[] = [];
  for (const [key, values] of grouped) {
    if (values.length < 4) continue;
    const sorted = [...values].sort((a, b) => a - b);
    const line = sorted[Math.floor(sorted.length / 2)];
    const h = hit(values, line);
    if (h.rate < 80) continue;
    const m = meta.get(key)!;
    out.push({ name: m.name, team: m.team, market: m.market, line, ...h });
  }
  return out.sort((a, b) => b.rate - a.rate || b.streak - a.streak).slice(0, 12);
}
