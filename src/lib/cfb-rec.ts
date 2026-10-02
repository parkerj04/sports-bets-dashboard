const URL = "https://github.com/sportsdataverse/sportsdataverse-data/releases/download/espn_cfb_player_box/player_box_2026.csv";

export type CfbCatcher = { name: string; teamId: string; rec: number; yards: number; td: number };

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

export async function cfbReceivers(teamIds: string[]) {
  const want = new Set(teamIds.map(String));
  const res = await fetch(URL, { next: { revalidate: 3600 } });
  if (!res.ok) return { source: "2026 college player box did not load.", players: [] as CfbCatcher[] };
  const text = await res.text();
  const lines = text.split("\n");
  const header = split(lines[0]);
  const i = {
    name: header.indexOf("athlete_name"),
    team: header.indexOf("team_id"),
    rec: header.indexOf("receptions"),
    yards: header.indexOf("receivingYards"),
    td: header.indexOf("receivingTouchdowns"),
  };
  const grouped = new Map<string, CfbCatcher>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = split(line);
    const teamId = cells[i.team];
    if (!want.has(teamId)) continue;
    const rec = Number(cells[i.rec]);
    if (!rec) continue;
    const name = cells[i.name];
    const key = `${teamId}|${name}`;
    const cur = grouped.get(key) || { name, teamId, rec: 0, yards: 0, td: 0 };
    cur.rec += rec;
    cur.yards += Number(cells[i.yards]) || 0;
    cur.td += Number(cells[i.td]) || 0;
    grouped.set(key, cur);
  }
  const players = Array.from(grouped.values()).sort((a, b) => b.yards - a.yards);
  return { source: "ESPN college player box via sportsdataverse, 2026. Season receptions and yards. Not a catch chart.", players };
}
