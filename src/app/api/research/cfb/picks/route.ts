import { NextResponse } from "next/server";
import { getCfbWeek } from "@/lib/cfb";
import { grade } from "@/lib/confidence";
export const dynamic = "force-dynamic";

function yards(line: string) {
  const m = line.match(/([\d,]+) YDS/);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
}
function tds(line: string) {
  const m = line.match(/(\d+) TD/);
  return m ? Number(m[1]) : 0;
}

export async function GET() {
  const week = await getCfbWeek();
  const picks = week.games.map((g) => {
    const awayY = yards(g.awayQbLine);
    const homeY = yards(g.homeQbLine);
    const awayTd = tds(g.awayQbLine);
    const homeTd = tds(g.homeQbLine);
    const qbEdge = homeY + homeTd * 80 - (awayY + awayTd * 80);
    const sideHome = qbEdge >= 0;
    const side = sideHome ? g.home : g.away;
    const qb = sideHome ? g.homeQb : g.awayQb;
    const other = sideHome ? g.awayQb : g.homeQb;
    const confirms: string[] = [];
    const flags: string[] = [];
    if (Math.abs(qbEdge) >= 200) confirms.push(`QB production gap ${Math.round(qbEdge)} (YDS+TD weighted)`);
    if (Math.abs(homeY - awayY) >= 400) confirms.push(`yard gap ${homeY} vs ${awayY}`);
    if (g.awayQbLine.includes("no season") || g.homeQbLine.includes("no season") || g.awayQb === "QB TBD" || g.homeQb === "QB TBD") {
      flags.push("one or both QBs have no ESPN season line yet");
    }
    if (Math.abs(qbEdge) < 80) flags.push("QB lines are close; this is not a mismatch");
    const gde = grade(confirms, flags);
    const against =
      flags.length > 0
        ? `Case against: ${flags.join("; ")}.`
        : `Case against: season passing line ignores opponent strength and this week's injury report. Confirm the starter before a unit.`;
    return {
      game: `${g.away} at ${g.home}`,
      market: "QB side",
      pick: `${side}, ${qb}`,
      score: gde.score,
      href: `/research/cfb/game?id=${g.id}`,
      why: `${g.away} ${g.awayRecord} (${g.awayConf}) at ${g.home} ${g.homeRecord} (${g.homeConf}). ${g.awayQb}: ${g.awayQbLine}. ${g.homeQb}: ${g.homeQbLine}. Side is ${side} because ${qb} out-produces ${other} on the ESPN season passing line (${awayY} / ${awayTd} TD vs ${homeY} / ${homeTd} TD). Posted ${g.spread}, total ${g.total} is context only. ${against} Score ${gde.score}.`,
    };
  });
  picks.sort((a, b) => b.score - a.score);
  return NextResponse.json({ picks });
}
