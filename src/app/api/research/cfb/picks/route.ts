import { NextResponse } from "next/server";
import { getCfbWeek } from "@/lib/cfb";
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
    const awayY = yards(g.awayQbLine); const homeY = yards(g.homeQbLine);
    const awayTd = tds(g.awayQbLine); const homeTd = tds(g.homeQbLine);
    const qbEdge = (homeY + homeTd * 80) - (awayY + awayTd * 80);
    const side = qbEdge >= 0 ? g.home : g.away;
    const qb = qbEdge >= 0 ? g.homeQb : g.awayQb;
    const score = Math.min(86, Math.round(50 + Math.min(Math.abs(qbEdge), 400) / 18));
    return {
      game: `${g.away} at ${g.home}`,
      market: "QB side",
      pick: `${side}, ${qb}`,
      score,
      href: `/research/cfb/game?id=${g.id}`,
      why: `${g.awayQb} ${g.awayQbLine}. ${g.homeQb} ${g.homeQbLine}. Records ${g.awayRecord} / ${g.homeRecord}. Conferences ${g.awayConf} / ${g.homeConf}. The side is the quarterback with the better season passing line, not the spread. Posted number ${g.spread}, total ${g.total}.`,
    };
  });
  picks.sort((a, b) => b.score - a.score);
  return NextResponse.json({ picks });
}
