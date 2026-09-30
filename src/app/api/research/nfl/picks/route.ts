import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
import scheme from "@/data/nfl-scheme-2026.json";
import coverage from "@/data/nfl-coverage.json";

export const dynamic = "force-dynamic";

const ABBR: Record<string, string> = {
  Cardinals: "ARI", Falcons: "ATL", Ravens: "BAL", Bills: "BUF", Panthers: "CAR", Bears: "CHI", Bengals: "CIN", Browns: "CLE",
  Cowboys: "DAL", Broncos: "DEN", Lions: "DET", Packers: "GB", Texans: "HOU", Colts: "IND", Jaguars: "JAX", Chiefs: "KC",
  Raiders: "LV", Chargers: "LAC", Rams: "LA", Dolphins: "MIA", Vikings: "MIN", Patriots: "NE", Saints: "NO", Giants: "NYG",
  Jets: "NYJ", Eagles: "PHI", Steelers: "PIT", "49ers": "SF", Seahawks: "SEA", Buccaneers: "TB", Titans: "TEN", Commanders: "WAS",
};
function abbr(name: string) {
  const hit = Object.keys(ABBR).find((k) => name.includes(k));
  return hit ? ABBR[hit] : "";
}
function winPct(rec: string) {
  const m = rec.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 0.5;
  return Number(m[1]) / Math.max(1, Number(m[1]) + Number(m[2]));
}

export async function GET() {
  const week = await getNflWeek();
  const teams = scheme.teams as Record<string, { epaPlay: number; passEpa: number; blitz: number; motion: number }>;
  const zones = coverage.teams as Record<string, { zonePct: number }>;
  const picks = week.games.map((g) => {
    const a = abbr(g.away); const h = abbr(g.home);
    const aEpa = teams[a]?.epaPlay ?? 0; const hEpa = teams[h]?.epaPlay ?? 0;
    const side = hEpa + winPct(g.homeRecord) >= aEpa + winPct(g.awayRecord) ? g.home : g.away;
    const gap = Math.abs(hEpa - aEpa);
    const total = typeof g.total === "number" ? g.total : parseFloat(String(g.total)) || 44;
    const pace = (teams[a]?.motion ?? 28) + (teams[h]?.motion ?? 28);
    const totalLean = total >= 47 || pace < 50 ? "Under" : "Over";
    const score = Math.min(86, Math.round(54 + gap * 80 + Math.abs(winPct(g.homeRecord) - winPct(g.awayRecord)) * 20));
    return {
      game: `${g.away} at ${g.home}`,
      market: "Side + total",
      pick: `${side} / ${totalLean} ${total}`,
      score,
      href: `/research/nfl/game?id=${g.id}`,
      why: `${a} EPA/play ${aEpa}, ${h} EPA/play ${hEpa} through week 3. Records ${g.awayRecord} / ${g.homeRecord}. ${h} defense zone rate ${zones[h]?.zonePct ?? "n/a"}% in the 2025 chart, ${a} ${zones[a]?.zonePct ?? "n/a"}%. Motion rates ${teams[a]?.motion ?? "n/a"}% / ${teams[h]?.motion ?? "n/a"}%. Posted number is ${g.spread}, total ${g.total}. Side follows the better EPA plus record. Total fades a number already at 47 or a low-motion pair. Price is not in the score.`,
    };
  });
  picks.sort((a, b) => b.score - a.score);
  return NextResponse.json({ picks });
}
