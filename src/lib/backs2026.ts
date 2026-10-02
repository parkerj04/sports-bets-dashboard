import zlib from "zlib";

const URL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz";

export type Carry = {
  week: string; team: string; def: string; name: string; kind: "rush" | "target";
  loc: string; yards: number | null; td: boolean; down: string; togo: string; desc: string;
};

function col(header: string[], name: string) { return header.indexOf(name); }
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

export async function backs2026(teams: string[]) {
  const res = await fetch(URL, { next: { revalidate: 3600 } });
  if (!res.ok) return { source: "2026 play-by-play file did not load.", players: [] };
  const text = zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const i = {
    week: col(header, "week"), team: col(header, "posteam"), def: col(header, "defteam"),
    rusher: col(header, "rusher_player_name"), rush: col(header, "rush_attempt"),
    receiver: col(header, "receiver_player_name"), complete: col(header, "complete_pass"),
    loc: col(header, "run_location"), gap: col(header, "run_gap"),
    yards: col(header, "yards_gained"), td: col(header, "touchdown"),
    down: col(header, "down"), togo: col(header, "ydstogo"), desc: col(header, "desc"),
  };
  const want = new Set(teams.map((t) => t.toUpperCase()));
  const grouped = new Map<string, Carry[]>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = split(line);
    const team = cells[i.team];
    if (!want.has(team)) continue;
    const rush = cells[i.rush] === "1";
    const name = rush ? cells[i.rusher] : "";
    if (!rush || !name) continue;
    const play: Carry = {
      week: cells[i.week], team, def: cells[i.def], name, kind: "rush",
      loc: [cells[i.loc], cells[i.gap]].filter(Boolean).join(" "),
      yards: Number.isFinite(Number(cells[i.yards])) ? Number(cells[i.yards]) : null,
      td: cells[i.td] === "1", down: cells[i.down], togo: cells[i.togo],
      desc: (cells[i.desc] || "").slice(0, 140),
    };
    const key = `${team}|${name}`;
    grouped.set(key, [...(grouped.get(key) || []), play]);
  }
  const targets = new Map<string, number>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = split(line);
    const team = cells[i.team];
    if (!want.has(team) || cells[i.complete] !== "1") continue;
    const name = cells[i.receiver];
    if (!grouped.has(`${team}|${name}`)) continue;
    targets.set(`${team}|${name}`, (targets.get(`${team}|${name}`) || 0) + 1);
    grouped.get(`${team}|${name}`)?.push({
      week: cells[i.week], team, def: cells[i.def], name, kind: "target",
      loc: "reception", yards: Number(cells[i.yards]) || 0, td: cells[i.td] === "1",
      down: cells[i.down], togo: cells[i.togo], desc: (cells[i.desc] || "").slice(0, 140),
    });
  }
  const players = Array.from(grouped.entries()).map(([key, plays]) => {
    const rushes = plays.filter((p) => p.kind === "rush");
    const rec = targets.get(key) || 0;
    const rushYards = rushes.reduce((s, p) => s + (p.yards || 0), 0);
    const recYards = plays.filter((p) => p.kind === "target").reduce((s, p) => s + (p.yards || 0), 0);
    const third = rushes.filter((p) => p.down === "3").length;
    const role = recYards > rushYards * 0.45 ? "receiving back" : third / Math.max(rushes.length, 1) >= 0.28 ? "third-down back" : "rushing back";
    return {
      name: plays[0].name, team: plays[0].team, role,
      carries: rushes.length, rushYards: Math.round(rushYards), rec, recYards: Math.round(recYards),
      third, thirdShare: rushes.length ? Math.round((third / rushes.length) * 100) : 0,
      left: rushes.filter((p) => p.loc.includes("left")).length,
      middle: rushes.filter((p) => p.loc.includes("middle")).length,
      right: rushes.filter((p) => p.loc.includes("right")).length,
      recent: rushes.slice(-8).reverse(),
    };
  }).filter((p) => p.carries >= 3).sort((a, b) => b.rushYards + b.recYards - (a.rushYards + a.recYards));
  return { source: "nflverse 2026 play-by-play. Carries, run side, and catches by the same back. No invented dots.", players };
}
