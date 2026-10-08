"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string; status?: string; game?: string; away?: string; home?: string };

const DESK: Play[] = [
  { id: "tue-lad-atl", away: "Dodgers", home: "Braves", pick: "First 5 under 3.5, Yamamoto and Sale only", score: 58, status: "published", why: "NLDS Game 3, 6:08 PM ET, series tied 1-1. MLB lists Yoshinobu Yamamoto (14-9, 2.53) and Chris Sale (14-9, 2.16). This is not Skubal. He started Game 1. Truist is clear, 0 percent precip, about 75 degrees and 12 mph at first pitch. Weather is not the path. The path is two confirmed starters and a full-game total of 6, so the first 5 isolates them and leaves the bullpens out. On Aug. 27 at Truist, Sale threw a 5-hit shutout and Yamamoto allowed one run. That is one game, not a law. Sale threw the ninth in the Wild Card clincher on Oct. 2, so rest is a flag. Atlanta won 5 of 6 regular-season meetings. One Sale mistake beats 3.5. Jarvis posted 71. That is a cap, not a keep. Play the first 5 under only. No moneyline." },
  { id: "sun-buf", away: "NE", home: "BUF", pick: "Buffalo -6.5, do not lay -7.5", score: 56, status: "published", why: "Bills are 3-0. Patriots are 1-2. Posted number on the board was Buffalo -6.5 to -7.5, total 49.5 to 50.5. Highmark is cloudy, 67 degrees, wind about 12 mph, 0 percent precip at the last check. That is a wind note, not a rain flag. The case against is the price and the unconfirmed injury list: A.J. Brown was listed with an ankle and TreVeyon Henderson was on the report, with no final inactive. A 3-0 home side is not an 80. Shop -6.5. If it is -7.5, pass." },
  { id: "sun-ten", away: "TEN", home: "BAL", pick: "Tennessee +11.5, shop the largest number", score: 54, status: "published", why: "Baltimore -11.5 is the number on the board, total 42. M&T has a light-rain report, about 15 percent, wind 6 mph. That is not a downpour, so it does not kill a side. It does say not to lay 11.5. Titans are 0-3. The case against is that a bad team can lose by 12 to a better one, and 0-3 is not a cover by itself. This is a price card. If the number is back to -13, it is gone." },
  { id: "sun-min-u", away: "MIA", home: "MIN", pick: "Under 38.5, indoor, do not chase a lower number", score: 54, status: "published", why: "U.S. Bank is a dome. Weather is not the reason. Posted total is 38.5, Minnesota -9.5, Miami 0-3. A total already this low is the market saying the game is small. The case against is a dome can still produce a late score, and a 0-3 side getting 9.5 can be live without the under cashing. Take 38.5 only. If it is 36.5, pass." },
  { id: "sun-kc", away: "KC", home: "LV", pick: "Raiders +4.5, both teams are 3-0", score: 53, status: "published", why: "Chiefs -4.5 at Las Vegas, total 47.5. Allegiant is a dome, 0 percent precip, so weather is not a flag. Both teams are 3-0. Laying a short number against another unbeaten is the Penn State mistake. The case against is Kansas City can still win by a score. Shop +4.5. Do not lay the Chiefs." },
  { id: "sun-det", away: "DET", home: "CAR", pick: "Carolina +3.5", score: 52, status: "published", why: "Detroit -3.5, total 51, 8:20. Bank of America is cloudy, 65 degrees, wind 2 mph, 0 percent precip. No weather flag. Lions are 2-1, Panthers 1-2. A field goal on the road at night is a short number. The case against is Detroit's offense can clear 3.5 without a blowout. This is the dog at a field goal, not a moneyline." },
];

const CLOSED = new Set(["published", "archived_superseded", "superseded", "won", "lost", "final", "graded"]);

function marketOf(pick: string) {
  return pick.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9.+-]+/g, " ").replace(/\s+/g, " ").trim();
}
function oneEach(rows: Play[]) {
  const out: Play[] = [];
  for (const p of rows) {
    const key = marketOf(p.pick).slice(0, 18);
    const hit = out.find((x) => marketOf(x.pick).includes(key) || key.includes(marketOf(x.pick).slice(0, 18)));
    if (!hit) out.push({ ...p });
  }
  return out;
}
function friday(p: Play) {
  if ((p.score || 0) >= 70) return "Cut";
  return "Cap";
}

function tone(call: string) {
  if (call === "Keep") return "#3f6b45";
  if (call === "Cut") return "#c45c4a";
  return "#b8881e";
}

function Board({ title, rows, label }: { title: string; rows: Play[]; label: string }) {
  if (!rows.length) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {oneEach(rows).map((p) => {
        const call = friday(p);
        return (
          <article key={p.id} className="border p-3 text-sm" style={{ background: "#0e0e0c", color: "#f0eee6", borderColor: "#2c2c28" }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-widest">{label}</p>
              <span className="font-mono">{p.score}</span>
            </div>
            <p className="mt-2">{p.pick}</p>
            <p className="mt-2 font-medium" style={{ color: tone(call) }}>{call}</p>
          </article>
        );
      })}
    </section>
  );
}
function teamHit(page: string, code: string) {
  const t = page.toUpperCase();
  const c = code.toUpperCase();
  const map: Record<string, string[]> = {
    NE: ["PATRIOT", "NE"], BUF: ["BILL", "BUF"], TEN: ["TITAN", "TEN"], BAL: ["RAVEN", "BAL"],
    MIA: ["DOLPHIN", "MIA"], MIN: ["VIKING", "MIN"], KC: ["CHIEF", "KC"], LV: ["RAIDER", "LV"],
    DET: ["LION", "DET"], CAR: ["PANTHER", "CAR"], LAD: ["DODGER", "LAD"], ATL: ["BRAVE", "ATL"],
  };
  return (map[c] || [c]).some((w) => t.includes(w));
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
  const review = rows.filter((p) => !CLOSED.has(String(p.status || "intake").toLowerCase()));
  if (!desk.length && !review.length) return null;
  return (
    <>
      <Board title="F.R.I.D.A.Y." rows={desk} label="Call" />
      <Board title="In review" rows={review} label="In review" />
    </>
  );
}
