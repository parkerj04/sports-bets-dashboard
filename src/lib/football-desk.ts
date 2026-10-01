export function registry(aligns: string[], misses: string[]) {
  let score = 40 + aligns.length * 7 - misses.length * 6;
  if (aligns.length >= 4 && misses.length === 0) score += 4;
  if (aligns.length < 3) score = Math.min(score, 62);
  if (misses.length >= 2) score = Math.min(score, 60);
  return Math.max(36, Math.min(78, Math.round(score)));
}

export function writeup(side: string, aligns: string[], misses: string[], score: number) {
  return `Registry for ${side}: ${aligns.join("; ") || "nothing stacked"}. ${misses.length ? `Not aligned: ${misses.join("; ")}.` : "Nothing in the registry is pointing the other way."} More alignments raise this. A record or a QB line alone cannot print a 70. Score ${score}.`;
}

function num(v?: string) {
  const n = parseFloat(String(v || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function footballRegistry(input: {
  away: string;
  home: string;
  awayRecord: string;
  homeRecord: string;
  mlAway?: string;
  mlHome?: string;
  awayQb?: string;
  homeQb?: string;
  awayQbLine?: string;
  homeQbLine?: string;
  awayOuts?: string[];
  homeOuts?: string[];
  awayL5?: string[];
  homeL5?: string[];
  awayYards?: string;
  homeYards?: string;
  predAway?: string;
  predHome?: string;
}) {
  const sides = [
    { team: input.home, rec: input.homeRecord, qb: input.homeQb, line: input.homeQbLine, outs: input.homeOuts || [], l5: input.homeL5 || [], yards: input.homeYards, pred: input.predHome, price: num(input.mlHome), raw: input.mlHome },
    { team: input.away, rec: input.awayRecord, qb: input.awayQb, line: input.awayQbLine, outs: input.awayOuts || [], l5: input.awayL5 || [], yards: input.awayYards, pred: input.predAway, price: num(input.mlAway), raw: input.mlAway },
  ];
  const ranked = sides.map((s, i) => {
    const other = sides[1 - i];
    const aligns: string[] = [];
    const misses: string[] = [];
    const sw = winPct(s.rec);
    const ow = winPct(other.rec);
    if (sw >= ow + 0.12) aligns.push(`record ${s.rec} vs ${other.rec}`);
    if (s.l5.filter((x) => /^W/i.test(x)).length >= 3) aligns.push(`last 5 ${s.l5.join(", ")}`);
    if (s.qb && s.qb !== "QB TBD" && s.line && s.line !== "no season line") aligns.push(`QB ${s.qb} ${s.line}`);
    if (num(s.yards) != null && num(other.yards) != null && (num(s.yards) || 0) > (num(other.yards) || 0) + 20) aligns.push(`yards ${s.yards} vs ${other.yards}`);
    if (s.pred && num(s.pred) != null && (num(s.pred) || 0) >= 58) aligns.push(`ESPN projection ${s.pred}%`);
    if (s.price != null && s.price < 0) aligns.push(`posted favorite ${s.raw}`);
    if (s.outs.length) misses.push(`out or doubtful: ${s.outs.slice(0, 3).join(", ")}`);
    if (!s.qb || s.qb === "QB TBD") misses.push("starting QB not confirmed");
    if (s.price != null && s.price > 0 && aligns.length < 3) misses.push(`posted ${s.raw} and the registry is not stacked`);
    if (other.outs.length === 0 && ow >= sw) misses.push(`${other.team} record ${other.rec} is not a soft side`);
    return { team: s.team, aligns, misses, score: registry(aligns, misses) };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return { pick: `${best.team} ML`, score: best.score, why: writeup(best.team, best.aligns, best.misses, best.score), aligns: best.aligns, misses: best.misses };
}

function winPct(rec: string) {
  const m = rec.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 0.5;
  const w = Number(m[1]);
  const l = Number(m[2]);
  return w + l === 0 ? 0.5 : w / (w + l);
}
