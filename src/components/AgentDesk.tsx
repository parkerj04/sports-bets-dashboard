"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string; status?: string; game?: string; away?: string; home?: string };

const DESK: Play[] = [
  { id: "desk-pitt-25", away: "PITT", home: "VT", pick: "Pittsburgh +2.5, shop the largest number", score: 58, status: "published", why: "Both agents took the points, so this is one card. Virginia Tech opened -4 to -5.5 and drifted to -2.5 or -3 by game day while the total climbed from about 52.5 to 54.5-55.5. DraftKings had 85 percent of the handle and 59 percent of the tickets on Virginia Tech, and the number still moved toward Pitt. That is the sharp-side tell. Both teams are 4-0, the first meeting of two unranked 4-0 power teams since 1985. Pitt is 3rd in scoring defense at 8.5 points allowed. James Franklin is in year one at Virginia Tech. Pat Narduzzi is in year 12. Ja'Kyrian Turner is probable. The flag is Malik Knight: two outlets ruled him out and the Oct 2 depth chart still listed him. Shop the largest number. Do not lay a shorter one." },
  { id: "desk-lib-65", away: "LIB", home: "DEL", pick: "Liberty -6.5, do not chase past -7", score: 56, status: "published", why: "Both agents took Liberty. The 70 and the 54 were the same bet. Liberty is 3-1 and put up 485 total yards and 263 rushing yards in the 34-17 win at Coastal Carolina, with 46 percent on third down and 13 scores on 16 red-zone trips. Delaware just lost 42-3 at Virginia with 160 total yards. Nick Minicucci hurt his knee in that game. Ryan Carty would not confirm him on Sept 30. If he sits, Braden Streeter was 2-for-16 for 9 yards and 2 picks in relief. The case against is real: Delaware is 2-0 at home, beat Coastal 22-14, and has a five-game home streak. One tracker had 58 percent of tickets on Liberty and 55 percent of the money on Delaware. Take -6.5. If the number is -7.5, pass." },
  { id: "desk-ida-145", away: "MTST", home: "IDHO", pick: "Idaho +14.5, shop the largest number", score: 54, status: "published", why: "This is a price card, not a form card. Montana State is the defending FCS champion, 5-0, No. 1 in both polls, on a 19-game win streak. Idaho is 0-4. The number drifted from Montana State -17.5 toward -14.5 or -15.5. That drift is the only reason the dog is on the board. A 15-point spread needs the favorite's cover rate and the blowout habit checked before anyone lays it. Shop the largest number. If it is back to -17, the card is gone." },
  { id: "desk-psu-25", away: "PSU", home: "NW", pick: "Penn State -2.5, on the board with the hole", score: 52, status: "published", why: "Posted so it does not slip, not because the side is clean. Penn State is 3-1 and blew a 17-0 lead in a 20-24 home loss to Wisconsin on Sept 26, then fell out of the Top 25. Matt Campbell is in year one after James Franklin was fired. He brought Rocco Becht and Carson Hansen from Iowa State. Northwestern is 2-1, 3-0 against the spread, lost 29-23 at Indiana after trailing 12-0, and beat Colorado 41-7. Northwestern also won last year's meeting 22-21 at Penn State. The total sat 45.5, down from about 47. A tracker had Northwestern with 34 percent of tickets and 40 percent of the money. The small number is the case against laying it. Decipher the price." },
  { id: "desk-war-att", away: "PIT", home: "CLE", pick: "Jaylen Warren over 15.5 rush attempts", score: 62, status: "published", why: "Rico Dowdle was out, so the backfield was Warren. His snap share had climbed from 37 percent to 71 percent to 89.8 percent over three weeks. He had 176 yards from scrimmage the week before. Cleveland entered allowing 2.7 explosive runs a game, 27th, and 120.3 rushing yards a game. Mason Graham is the flag on the run fit. Attempts can still land if the yards do not. The agent grade on the companion yards card was 17 carries and 93 yards, so the attempts number cleared. This was the cleaner of the two Warren bets." },
  { id: "desk-war-yds", away: "PIT", home: "CLE", pick: "Jaylen Warren over 67.5 rush yards", score: 60, status: "published", why: "Same role as the attempts card. Dowdle out, snap share 89.8 percent, Cleveland 23rd in yards per carry at 4.5 and allowing 120.3 rushing yards with 13 runs of 10-plus. The short-yardage stop rate and the last meeting against this front were not sourced, so those are gaps, not invented edges. The case against was game script: if Pittsburgh trailed, the carries could die. The agent grade was 93 yards on 17 carries, so 67.5 cleared. The anytime ticket on the same role lost. Volume was real. The score was not." },
  { id: "desk-murt", away: "PIT", home: "CLE", pick: "Pat Freiermuth over 27.5 receiving yards", score: 58, status: "published", why: "Cleveland was in man after Week 1, 8th in man rate and first in middle-of-field closed. The fit is a tight end against a linebacker. Freiermuth had 3 catches for 63 yards in the Dec 28, 2025 meeting. Darnell Washington splits the room, so the target is not a lock. Posted so the Warren cards do not hide a different market." },
  { id: "desk-fannin", away: "PIT", home: "CLE", pick: "Harold Fannin Jr. anytime touchdown, plus money only", score: 56, status: "published", why: "Both agents had the plus-money score. Fannin had an 86 percent snap share, 9 targets and 2 touchdowns the week before against Carolina, and was 2-for-2 on red-zone looks. Pittsburgh is the zone side and Joey Porter is in Dallas. Watson was behind a line missing both Jenkins, with Watt on the edge. The Steelers rank against tight ends was not confirmed, so the matchup rate is a gap. Only if the number is plus money. The agent grade was a 2-yard touchdown, so the plus-money ticket cashed. The 7-leg box around it lost." },
];

function ticketOf(p: Play) {
  const m = `${p.id} ${p.pick}`.match(/\bP(\d+)\b|p(\d+)-leg|\bSGP\b/i);
  return m ? (m[0].toUpperCase().includes("SGP") ? "SGP" : `P${m[1] || m[2]}`) : "";
}
function marketOf(pick: string) {
  return pick.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9.+-]+/g, " ").replace(/\s+/g, " ").trim();
}
function oneEach(rows: Play[]) {
  const out: Play[] = [];
  for (const p of rows) {
    const key = marketOf(p.pick).replace(/shop the largest number|do not chase past -7|on the board with the hole|plus money only/g, "").trim();
    const hit = out.find((x) => marketOf(x.pick).includes(key.slice(0, 18)) || key.includes(marketOf(x.pick).slice(0, 18)));
    if (!hit) out.push({ ...p });
    else if ((p.why || "").length > (hit.why || "").length && p.status !== "published") hit.why = p.why;
  }
  return out;
}
function Board({ title, rows }: { title: string; rows: Play[] }) {
  if (!rows.length) return null;
  const groups = new Map<string, Play[]>();
  const singles: Play[] = [];
  for (const p of oneEach(rows)) {
    const ticket = ticketOf(p);
    if (!ticket) singles.push(p);
    else groups.set(ticket, [...(groups.get(ticket) || []), p]);
  }
  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {singles.map((p, i) => (
        <div key={p.id} className="card p-4 text-sm">
          <div className="flex justify-between gap-2"><span className="font-semibold">{i + 1}. {p.pick}</span><span className="font-mono">{p.score}</span></div>
          <p className="text-sm mt-2 leading-6">{p.why}</p>
        </div>
      ))}
      {Array.from(groups.entries()).map(([name, legs]) => (
        <div key={name} className="card p-4 text-sm space-y-2">
          <div className="flex justify-between gap-2"><span className="font-semibold">{name} · {legs.length} legs</span><span className="font-mono">{Math.min(...legs.map((l) => l.score))}</span></div>
          {legs.map((l) => <div key={l.id} className="border-t border-card-border pt-2"><div className="font-medium">{l.pick}</div><p className="text-sm mt-2 leading-6 text-muted">{l.why}</p></div>)}
        </div>
      ))}
    </section>
  );
}
function teamHit(page: string, code: string) {
  const t = page.toUpperCase();
  const c = code.toUpperCase();
  if (c === "PIT") return t.includes("STEELER") || t === "PIT";
  if (c === "PITT") return t.includes("PANTHER") || t.includes("PITT");
  if (c === "CLE") return t.includes("BROWN") || t.includes("CLEVELAND") || t === "CLE";
  if (c === "VT") return t.includes("VIRGINIA TECH") || t.includes("HOKIES") || t === "VT";
  if (c === "PSU") return t.includes("PENN STATE") || t === "PSU";
  if (c === "NW") return t.includes("NORTHWESTERN") || t === "NW";
  if (c === "LIB") return t.includes("LIBERTY") || t === "LIB";
  if (c === "DEL") return t.includes("DELAWARE") || t === "DEL";
  if (c === "MTST") return t.includes("MONTANA") || t === "MTST";
  if (c === "IDHO" || c === "IDA") return t.includes("IDAHO") || t === "IDHO";
  return t.includes(c);
}
function onGame(away: string, home: string, p: Play) {
  return (teamHit(away, p.away || "") && teamHit(home, p.home || "")) || (teamHit(away, p.home || "") && teamHit(home, p.away || ""));
}
export function AgentDesk({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Play[]>([]);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/agent/plays?away=${encodeURIComponent(away)}&home=${encodeURIComponent(home)}`)
      .then((r) => r.json()).then((d) => setRows(d.plays || [])).catch(() => setRows([]));
  }, [away, home]);
  const desk = DESK.filter((p) => onGame(away, home, p));
  const review = rows.filter((p) => p.status !== "published" && p.status !== "archived_superseded" && p.status !== "superseded");
  if (!desk.length && !review.length) return null;
  return (
    <>
      <Board title="Desk" rows={desk} />
      <Board title="In review" rows={review} />
    </>
  );
}
