import type { Edge } from "./mlb";

function nameKey(e: Edge) {
  const raw = `${e.pitcher || ""} ${e.pick || ""}`.toLowerCase();
  return raw
    .replace(/\(.*?\)/g, " ")
    .replace(/strikeouts.*/g, " ")
    .replace(/\bproj\b.*/g, " ")
    .replace(/[^a-z ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "over", "under", "runs", "hits", "team"].includes(w))
    .slice(0, 3)
    .join(" ");
}

export function dedupeEdges(list: Edge[]): Edge[] {
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const e of list) {
    const k = `${e.gamePk || e.game}|${e.market}|${nameKey(e)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out.sort((a, b) => b.edgeScore - a.edgeScore);
}

export function isPlayable(e: Edge) {
  if (e.playable === false) return false;
  if (e.playable === true) return e.edgeScore >= 64;
  const flagged = /flags \(/i.test(e.reasoning) || /case against: last /i.test(e.reasoning);
  return e.edgeScore >= 64 && !flagged;
}
