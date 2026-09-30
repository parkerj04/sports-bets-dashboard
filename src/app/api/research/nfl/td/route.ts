import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
import coverage from "@/data/nfl-coverage.json";
import scheme from "@/data/nfl-scheme-2026.json";

export const dynamic = "force-dynamic";

type Player = { name: string; team: string; tgt: number; zonePct: number; compPct: number };

export async function GET() {
  const week = await getNflWeek();
  const players = coverage.players as Player[];
  const zones = coverage.teams as Record<string, { zonePct: number }>;
  const schemes = scheme.teams as Record<string, { passEpa: number; epaPlay: number; blitz: number }>;
  const cards = [];
  for (const g of week.games) {
    const pairs = [
      { off: abbr(g.away), def: abbr(g.home), game: `${g.away} at ${g.home}` },
      { off: abbr(g.home), def: abbr(g.away), game: `${g.away} at ${g.home}` },
    ];
    for (const p of pairs) {
      const pool = players.filter((x) => x.team === p.off).slice(0, 3);
      const defZone = zones[p.def]?.zonePct ?? 60;
      const offEpa = schemes[p.off]?.passEpa ?? 0;
      const defBlitz = schemes[p.def]?.blitz ?? 8;
      for (const pl of pool) {
        const zoneFit = pl.zonePct - 50 + (defZone - 60);
        const score = Math.round(48 + Math.min(pl.tgt, 160) / 8 + zoneFit / 4 + offEpa * 40 - Math.max(0, defBlitz - 12));
        const why = [
          `${pl.tgt} charted targets, ${pl.zonePct}% of them vs zone, catch rate ${pl.compPct}%.`,
          `${p.def} defense was ${defZone}% zone in the 2025 chart.`,
          `${p.off} pass EPA/play this year ${offEpa}. ${p.def} extra-rusher rate ${defBlitz}%.`,
          zoneFit > 8 ? "Coverage fit is the reason, not the price." : "Usage is real. Coverage fit is only average.",
        ].join(" ");
        cards.push({ game: p.game, pick: `${pl.name} anytime TD`, team: pl.team, score: Math.max(40, Math.min(88, score)), why });
      }
    }
  }
  cards.sort((a, b) => b.score - a.score);
  return NextResponse.json({ cards: cards.slice(0, 12), note: "Matchup and role only. No odds in the score." });
}

function abbr(name: string) {
  const map: Record<string, string> = {
    Cardinals: "ARI", Falcons: "ATL", Ravens: "BAL", Bills: "BUF", Panthers: "CAR", Bears: "CHI", Bengals: "CIN", Browns: "CLE",
    Cowboys: "DAL", Broncos: "DEN", Lions: "DET", Packers: "GB", Texans: "HOU", Colts: "IND", Jaguars: "JAX", Chiefs: "KC",
    Raiders: "LV", Chargers: "LAC", Rams: "LA", Dolphins: "MIA", Vikings: "MIN", Patriots: "NE", Saints: "NO", Giants: "NYG",
    Jets: "NYJ", Eagles: "PHI", Steelers: "PIT", "49ers": "SF", Seahawks: "SEA", Buccaneers: "TB", Titans: "TEN", Commanders: "WAS",
  };
  const hit = Object.keys(map).find((k) => name.includes(k));
  return hit ? map[hit] : name.slice(0, 3).toUpperCase();
}
