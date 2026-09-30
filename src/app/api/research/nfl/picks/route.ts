import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
import { grade } from "@/lib/confidence";
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
    const a = abbr(g.away);
    const h = abbr(g.home);
    const aEpa = teams[a]?.epaPlay ?? 0;
    const hEpa = teams[h]?.epaPlay ?? 0;
    const aZone = zones[a]?.zonePct;
    const hZone = zones[h]?.zonePct;
    const aMot = teams[a]?.motion;
    const hMot = teams[h]?.motion;
    const sideHome = hEpa + winPct(g.homeRecord) >= aEpa + winPct(g.awayRecord);
    const side = sideHome ? g.home : g.away;
    const total = typeof g.total === "number" ? g.total : parseFloat(String(g.total)) || 44;
    const pace = (aMot ?? 28) + (hMot ?? 28);
    const totalLean = total >= 47 || pace < 50 ? "Under" : "Over";
    const confirms: string[] = [];
    const flags: string[] = [];
    const epaGap = Math.abs(hEpa - aEpa);
    if (epaGap >= 0.08) confirms.push(`EPA/play gap ${epaGap.toFixed(3)} (${a} ${aEpa.toFixed(3)}, ${h} ${hEpa.toFixed(3)})`);
    if (Math.abs(winPct(g.homeRecord) - winPct(g.awayRecord)) >= 0.25) confirms.push(`records ${g.awayRecord} / ${g.homeRecord}`);
    if (total >= 48) confirms.push(`posted total ${total} is already high`);
    if (epaGap < 0.03) flags.push(`EPA/play almost even (${a} ${aEpa.toFixed(3)} vs ${h} ${hEpa.toFixed(3)})`);
    if (!a || !h) flags.push("could not map a team to the 2026 scheme file");
    const gde = grade(confirms, flags);
    const against =
      flags.length > 0
        ? `Case against: ${flags.join("; ")}.`
        : `Case against: ESPN price and 2025/early-2026 charted rates are not the same as this week's injury report. Check inactives before a unit.`;
    return {
      game: `${g.away} at ${g.home}`,
      market: "Side + total",
      pick: `${side} / ${totalLean} ${total}`,
      score: gde.score,
      href: `/research/nfl/game?id=${g.id}`,
      why: `${g.away} (${g.awayRecord}) at ${g.home} (${g.homeRecord}). Posted ${g.spread}, total ${g.total}. ${a || g.away} EPA/play ${aEpa.toFixed(3)}, motion ${aMot ?? "n/a"}%, zone allowed chart ${aZone ?? "n/a"}%. ${h || g.home} EPA/play ${hEpa.toFixed(3)}, motion ${hMot ?? "n/a"}%, zone ${hZone ?? "n/a"}%. Side is ${side} because ${sideHome ? `${h} holds the EPA+record edge` : `${a} holds the EPA+record edge`}. Total lean ${totalLean} because ${total >= 47 ? `the number is already ${total}` : pace < 50 ? `combined motion ${pace.toFixed(0)} is low` : `the number ${total} is not inflated`}. ${against} Score ${gde.score}.`,
    };
  });
  picks.sort((a, b) => b.score - a.score);
  return NextResponse.json({ picks });
}
