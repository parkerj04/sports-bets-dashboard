"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string; status?: string; game?: string; away?: string; home?: string };

const DESK: Play[] = [
  { id: "desk-pitt-25", away: "PITT", home: "VT", pick: "Pittsburgh +2.5, shop the largest number", score: 58, status: "published", why: "Both agents took Pitt plus the points. The number moved from Virginia Tech -4 to -5.5 down to -2.5, and both teams are 4-0. Malik Knight's status conflicts, so this is not an 80. It is on the edge. Shop it. Do not lay a shorter number." },
  { id: "desk-lib-65", away: "LIB", home: "DEL", pick: "Liberty -6.5, do not chase past -7", score: 56, status: "published", why: "Both agents took Liberty. The 70 and the 54 were the same bet. Delaware just lost 42-3 at Virginia and Minicucci's knee is unconfirmed. Delaware is 2-0 at home, so the flag stays. Take -6.5. If it is -7.5, pass." },
  { id: "desk-ida-145", away: "MTST", home: "IDHO", pick: "Idaho +14.5, shop the largest number", score: 54, status: "published", why: "The number drifted from Montana State -17.5 toward -14.5. That is the reason, not Idaho's form. Idaho is 0-4 against a 19-game winner. On the edge only at the big number." },
  { id: "desk-psu-25", away: "PSU", home: "NW", pick: "Penn State -2.5, on the board with the hole", score: 52, status: "published", why: "Posted so it does not slip. Penn State blew a 17-point lead to Wisconsin and Northwestern just took Indiana to the wire. The small number is the case against laying it. Decipher the price, do not treat 58 as clean." },
  { id: "desk-war-att", away: "PIT", home: "CLE", pick: "Jaylen Warren over 15.5 rush attempts", score: 62, status: "published", why: "Dowdle is out. Attempts can still land if the yards do not. Cleveland allows explosive runs. Mason Graham is the flag. This is the cleaner Warren number." },
  { id: "desk-war-yds", away: "PIT", home: "CLE", pick: "Jaylen Warren over 67.5 rush yards", score: 60, status: "published", why: "Same role, snap share up to 89.8 percent, Cleveland entered allowing 120.3 rushing yards. The yards line is shorter than the attempts line. On the edge at -115." },
  { id: "desk-murt", away: "PIT", home: "CLE", pick: "Pat Freiermuth over 27.5 receiving yards", score: 58, status: "published", why: "Man-coverage fit against a linebacker, and 3 for 63 in the December 28, 2025 meeting. Washington splits the room. Posted so the yards card does not hide it." },
  { id: "desk-fannin", away: "PIT", home: "CLE", pick: "Harold Fannin Jr. anytime touchdown, plus money only", score: 56, status: "published", why: "Both agents had the plus-money score. 86 percent snaps and two red-zone scores the week before. Steelers rank against tight ends was not confirmed. Only if the number is plus money." },
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
          <p className="text-xs mt-1">{p.why}</p>
        </div>
      ))}
      {Array.from(groups.entries()).map(([name, legs]) => (
        <div key={name} className="card p-4 text-sm space-y-2">
          <div className="flex justify-between gap-2"><span className="font-semibold">{name} · {legs.length} legs</span><span className="font-mono">{Math.min(...legs.map((l) => l.score))}</span></div>
          {legs.map((l) => <div key={l.id} className="border-t border-card-border pt-2"><div className="font-medium">{l.pick}</div><p className="text-xs mt-1 text-muted">{l.why}</p></div>)}
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
