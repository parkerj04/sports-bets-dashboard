import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
import coverage from "@/data/nfl-coverage.json";
import scheme from "@/data/nfl-scheme-2026.json";

export const dynamic = "force-dynamic";

type Player = { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number };

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

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const week = await getNflWeek();
  const players = coverage.players as Player[];
  const zones = coverage.teams as Record<string, { zonePct: number; snaps: number }>;
  const schemes = scheme.teams as Record<string, { passEpa: number; epaPlay: number; blitz: number; passRate: number }>;
  const cards = [];
  for (const g of week.games) {
    if (id && g.id !== id) continue;
    const pairs = [
      { off: abbr(g.away), def: abbr(g.home), game: `${g.away} at ${g.home}`, id: g.id },
      { off: abbr(g.home), def: abbr(g.away), game: `${g.away} at ${g.home}`, id: g.id },
    ];
    for (const p of pairs) {
      const pool = players.filter((x) => x.team === p.off).slice(0, 2);
      const defZone = zones[p.def]?.zonePct ?? 60;
      const offEpa = schemes[p.off]?.passEpa ?? 0;
      const passRate = schemes[p.off]?.passRate ?? 55;
      const defBlitz = schemes[p.def]?.blitz ?? 8;
      for (const pl of pool) {
        const zoneGap = pl.zonePct - (100 - defZone);
        let score = 46 + Math.min(pl.tgt, 140) / 10;
        const bits = [
          `${pl.name} has ${pl.tgt} charted targets, ${pl.zoneTgt} vs zone and ${pl.manTgt} vs man, catch rate ${pl.compPct}%. Volume is the role. This file does not have red-zone touches, so a TD is inferred from opportunity, not a painted goal-line role.`,
        ];
        if (defZone >= 65 && pl.zonePct >= 65) {
          score += 8;
          bits.push(`${p.def} played zone on ${defZone}% of charted snaps. ${pl.name} took ${pl.zonePct}% of his targets against zone. That is the coverage fit.`);
        } else if (defZone <= 55 && pl.zonePct < 55) {
          score += 4;
          bits.push(`${p.def} is closer to man (${defZone}% zone). ${pl.name} is not a pure zone target (${pl.zonePct}%). Fit is fine, not a smash.`);
        } else {
          score -= 2;
          bits.push(`${p.def} zone rate is ${defZone}%. ${pl.name} zone-target rate is ${pl.zonePct}%. Coverage fit is mixed (gap ${Math.round(zoneGap)}).`);
        }
        if (offEpa > 0.05 && passRate >= 55) { score += 5; bits.push(`${p.off} pass EPA/play is ${offEpa} at a ${passRate}% pass rate. Script should throw.`); }
        else bits.push(`${p.off} pass EPA/play is ${offEpa} at a ${passRate}% pass rate. Do not assume a pass-heavy script.`);
        if (defBlitz >= 14) { score -= 4; bits.push(`${p.def} extra-rusher rate is ${defBlitz}%. Pressure cuts receiving TDs more than it creates them.`); }
        bits.push(score >= 68 ? "Best TD shape on this side if the number is plus money. First-TD is the alt only if this is the top name on the side. No price in this feed." : "Volume lean. Coverage or script does not finish the case. Do not force an alt.");
        cards.push({ game: p.game, pick: `${pl.name} anytime TD`, score: Math.max(40, Math.min(88, Math.round(score))), why: bits.join(" "), href: `/research/nfl/game?id=${p.id}` });
      }
    }
  }
  cards.sort((a, b) => b.score - a.score);
  return NextResponse.json({
    cards: id ? cards : cards.slice(0, 10),
    note: "Targets, zone fit, pass script, pressure. No odds. Red-zone share is not in the free file.",
  });
}
