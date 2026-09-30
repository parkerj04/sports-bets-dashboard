import type { Edge } from "./mlb";

export type Check = {
  id: string;
  label: string;
  ok: boolean | null;
  detail: string;
};

export type Ticket = {
  sport: string;
  game: string;
  checks: Check[];
  script: string;
  market: string;
  notes: string[];
};

export function impliedTotals(totalRaw: string | number, spreadRaw: string, home: string, away: string) {
  const total = typeof totalRaw === "number" ? totalRaw : parseFloat(String(totalRaw));
  if (!Number.isFinite(total)) return null;
  const s = String(spreadRaw || "");
  const m = s.match(/([+-]?\d+\.?\d*)\s*$/);
  const n = m ? parseFloat(m[1]) : NaN;
  let homeSpread = 0;
  if (Number.isFinite(n)) {
    const favIsHome = s.toLowerCase().includes(home.toLowerCase().split(" ").pop() || "zzz") || s.startsWith(home.slice(0, 3));
    const favIsAway = s.toLowerCase().includes(away.toLowerCase().split(" ").pop() || "zzz");
    if (favIsHome && !favIsAway) homeSpread = n < 0 ? n : -Math.abs(n);
    else if (favIsAway && !favIsHome) homeSpread = n < 0 ? Math.abs(n) : n;
    else homeSpread = n;
  }
  const homeImp = Math.round((total / 2 - homeSpread / 2) * 10) / 10;
  const awayImp = Math.round((total - homeImp) * 10) / 10;
  return { total, homeSpread, homeImp, awayImp };
}

export function stampEdges(edges: Edge[], ticket: Ticket): Edge[] {
  const hard = ticket.checks.filter((c) => c.ok === false);
  const block =
    `Ticket: ${ticket.checks.map((c) => `${c.ok === true ? "OK" : c.ok === false ? "FLAG" : "OPEN"} ${c.label}${c.detail ? ` (${c.detail})` : ""}`).join(" · ")}. Script: ${ticket.script}`;
  return edges.map((e) => {
    let score = e.edgeScore;
    const extra: string[] = [];
    const m = e.market.toLowerCase();
    for (const f of hard) {
      if (f.id === "weather" && (m.includes("total") || m.includes("home run") || m.includes("hr"))) extra.push(f.detail);
      if (f.id === "lineup" && (m.includes("batter") || m.includes("stolen") || m.includes("hit"))) extra.push(f.detail);
      if (f.id === "injury" && (m.includes("side") || m.includes("ml") || m.includes("td") || m.includes("money"))) extra.push(f.detail);
      if (f.id === "qb" && (m.includes("side") || m.includes("ml") || m.includes("total") || m.includes("pass"))) extra.push(f.detail);
    }
    if (extra.length) score = Math.min(score, 64);
    return {
      ...e,
      edgeScore: score,
      reasoning: `${e.reasoning} ${block}${extra.length ? ` Extra flags on this market: ${extra.join("; ")}.` : ""}`,
    };
  });
}
