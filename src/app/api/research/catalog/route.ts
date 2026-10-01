import { NextResponse } from "next/server";
import { findTodaysEdges, getPitcherSeasonStats, getTeamKPct, getTodaysGames } from "@/lib/mlb";
import { alwaysCard } from "@/lib/game-card";
import { dedupeEdges } from "@/lib/edges";
import { getNflWeek } from "@/lib/nfl";
import { getCfbWeek } from "@/lib/cfb";
import scheme from "@/data/nfl-scheme-2026.json";
import coverage from "@/data/nfl-coverage.json";
import { grade } from "@/lib/confidence";
import { impliedTotals } from "@/lib/ticket";

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
function yards(line: string) {
  const m = line.match(/([\d,]+) YDS/);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}
function tds(line: string) {
  const m = line.match(/(\d+) TD/);
  return m ? Number(m[1]) : 0;
}

export type CatalogPick = {
  id: string;
  sport: "MLB" | "NFL" | "NCAAF";
  event: string;
  selection: string;
  market: string;
  score: number;
  research: string;
};

export async function GET() {
  const out: CatalogPick[] = [];
  try {
    const [games, edges] = await Promise.all([getTodaysGames(), findTodaysEdges()]);
    const extras = [];
    for (const g of games) {
      const [homeP, awayP, homeT, awayT] = await Promise.all([
        g.homePitcherId ? getPitcherSeasonStats(g.homePitcherId) : Promise.resolve(null),
        g.awayPitcherId ? getPitcherSeasonStats(g.awayPitcherId) : Promise.resolve(null),
        getTeamKPct(g.homeId),
        getTeamKPct(g.awayId),
      ]);
      extras.push(...(await alwaysCard(g, homeP, awayP, homeT, awayT)));
    }
    const mlb = dedupeEdges([...extras, ...edges.filter((e) => e.market !== "Pitcher Ks")]);
    for (const e of mlb) {
      out.push({
        id: `mlb-${e.gamePk}-${e.market}-${e.pick}`,
        sport: "MLB",
        event: e.game,
        selection: e.pick,
        market: e.market,
        score: e.edgeScore,
        research: e.reasoning,
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const week = await getNflWeek();
    const teams = scheme.teams as Record<string, { epaPlay: number; motion: number }>;
    const zones = coverage.teams as Record<string, { zonePct: number }>;
    for (const g of week.games) {
      const a = abbr(g.away);
      const h = abbr(g.home);
      const aEpa = teams[a]?.epaPlay ?? 0;
      const hEpa = teams[h]?.epaPlay ?? 0;
      const sideHome = hEpa + winPct(g.homeRecord) >= aEpa + winPct(g.awayRecord);
      const side = sideHome ? g.home : g.away;
      const total = typeof g.total === "number" ? g.total : parseFloat(String(g.total)) || 44;
      const pace = (teams[a]?.motion ?? 28) + (teams[h]?.motion ?? 28);
      const totalLean = total >= 47 || pace < 50 ? "Under" : "Over";
      const confirms: string[] = [];
      const flags: string[] = [];
      if (Math.abs(hEpa - aEpa) >= 0.08) confirms.push(`EPA gap`);
      if (!a || !h) flags.push("scheme map miss");
      const gde = grade(confirms, flags);
      const imp = impliedTotals(g.total, g.spread, g.home, g.away);
      out.push({
        id: `nfl-${g.id}-side`,
        sport: "NFL",
        event: `${g.away} at ${g.home}`,
        selection: `${side} / ${totalLean} ${total}`,
        market: "Side + total",
        score: gde.score,
        research: `${g.spread}, total ${g.total}. ${imp ? `Implied ${g.away} ${imp.awayImp} / ${g.home} ${imp.homeImp}. ` : ""}${g.leanWhy || ""} Score ${gde.score}. Zone chart ${zones[a]?.zonePct ?? "n/a"}/${zones[h]?.zonePct ?? "n/a"}.`,
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const week = await getCfbWeek();
    for (const g of week.games) {
      const awayY = yards(g.awayQbLine);
      const homeY = yards(g.homeQbLine);
      const awayTd = tds(g.awayQbLine);
      const homeTd = tds(g.homeQbLine);
      const qbEdge = homeY + homeTd * 80 - (awayY + awayTd * 80);
      const sideHome = qbEdge >= 0;
      const side = sideHome ? g.home : g.away;
      const qb = sideHome ? g.homeQb : g.awayQb;
      const flags = [];
      if (g.awayQb === "QB TBD" || g.homeQb === "QB TBD") flags.push("QB TBD");
      const gde = grade(Math.abs(qbEdge) >= 200 ? ["QB gap"] : [], flags);
      out.push({
        id: `cfb-${g.id}`,
        sport: "NCAAF",
        event: `${g.away} at ${g.home}`,
        selection: `${side}, ${qb}`,
        market: "QB side",
        score: gde.score,
        research: `${g.awayQb}: ${g.awayQbLine}. ${g.homeQb}: ${g.homeQbLine}. Posted ${g.spread}, O/U ${g.total}. Score ${gde.score}.`,
      });
    }
  } catch (err) {
    console.error(err);
  }

  out.sort((a, b) => b.score - a.score);
  return NextResponse.json({ options: out });
}
