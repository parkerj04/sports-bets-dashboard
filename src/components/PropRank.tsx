"use client";

import { useMemo, useState } from "react";

export type PropGame = { key: string; date: string; opp: string; value: number; box: string };

export type PropItem = {
  id: string;
  player: string;
  face?: string;
  team: string;
  opp: string;
  when?: string;
  market: string;
  games: PropGame[];
  confirmed: boolean;
  season: { label: string; value: string }[];
  matchup: string;
  script: string;
  star?: boolean;
};

type Win = "L5" | "L10" | "Season";
type Tab = "Trends" | "Matchup" | "Games";

function median(values: number[]) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2;
  const snapped = Math.round(mid * 2) / 2;
  return snapped > 0 ? snapped : 0.5;
}

function one(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function sliceOf(games: PropGame[], win: Win) {
  if (win === "L5") return games.slice(-5);
  if (win === "L10") return games.slice(-10);
  return games;
}

function read(games: PropGame[], line: number) {
  const hits = games.filter((g) => g.value > line).length;
  const avg = games.length ? games.reduce((s, g) => s + g.value, 0) / games.length : 0;
  return { hits, n: games.length, avg, pct: games.length ? hits / games.length : 0 };
}

function callFor(pct: number, n: number, confirmed: boolean) {
  if (!confirmed) return "Cut";
  if (n >= 5 && pct >= 0.65) return "Keep";
  if (n >= 5 && pct < 0.35) return "Cut";
  return "Cap";
}

function tone(call: string) {
  if (call === "Keep") return "#3f6b45";
  if (call === "Cut") return "#c45c4a";
  return "#b8881e";
}

export function PropRank({ rows, loading }: { rows: PropItem[]; loading?: boolean }) {
  const [win, setWin] = useState<Win>("L10");
  const [openId, setOpenId] = useState<string | null>(null);
  const ranked = useMemo(() => {
    return rows
      .map((row) => {
        const number = median(row.games.map((g) => g.value));
        if (number == null || row.games.length === 0) return null;
        const stats = read(sliceOf(row.games, win), number);
        if (!stats.n) return null;
        return { row, number, stats };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.stats.pct - a.stats.pct || b.stats.n - a.stats.n);
  }, [rows, win]);

  const people = useMemo(() => {
    const map = new Map<string, typeof ranked>();
    for (const item of ranked) {
      const key = `${item.row.team}|${item.row.player}`;
      map.set(key, [...(map.get(key) || []), item]);
    }
    return [...map.values()]
      .map((mates) => ({ best: mates.slice().sort((a, b) => b.stats.pct - a.stats.pct)[0], mates }))
      .sort((a, b) => b.best.stats.pct - a.best.stats.pct || b.best.stats.n - a.best.stats.n);
  }, [ranked]);

  const boxes = useMemo(() => {
    const seen = new Set<string>();
    const out: { script: string; rows: typeof people }[] = [];
    for (const person of people) {
      const key = `${person.best.row.team}|${person.best.row.player}`;
      if (seen.has(key)) continue;
      const mates = people.filter((x) => x.best.row.script === person.best.row.script);
      mates.forEach((m) => seen.add(`${m.best.row.team}|${m.best.row.player}`));
      out.push({ script: person.best.row.script, rows: mates });
    }
    return out;
  }, [people]);

  const open = ranked.find((x) => x.row.id === openId) || null;
  const samePlayer = open ? ranked.filter((x) => x.row.player === open.row.player && x.row.team === open.row.team) : [];

  return (
    <section className="space-y-3" style={{ color: "#f0eee6" }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-medium">Prop desk</h2>
        <div className="flex gap-1">
          {(["L5", "L10", "Season"] as const).map((key) => (
            <button key={key} type="button" onClick={() => setWin(key)} className="min-h-11 rounded-full px-3 text-sm" style={{ background: win === key ? "#2c2c28" : "transparent", color: "#f0eee6" }}>{key}</button>
          ))}
        </div>
      </div>
      {loading ? <p className="text-sm" style={{ color: "#a89f90" }}>Loading logs…</p> : null}
      {!loading && ranked.length === 0 ? <p className="text-sm" style={{ color: "#a89f90" }}>No real log to rank.</p> : null}
      {open ? (
        <>
          <div className="flex gap-1 overflow-x-auto">
            {samePlayer.map((item) => (
              <button key={item.row.id} type="button" onClick={() => setOpenId(item.row.id)} className="min-h-11 shrink-0 rounded-full px-3 text-sm" style={{ background: item.row.id === open.row.id ? "#2c2c28" : "transparent", color: "#f0eee6" }}>{item.row.market}</button>
            ))}
          </div>
          <Card key={open.row.id} item={open.row} number={open.number} onBack={() => setOpenId(null)} />
        </>
      ) : null}
      {boxes.map((box) => (
        <div key={box.script} className="border" style={{ borderColor: "#2c2c28", background: "#0e0e0c" }}>
          <p className="border-b px-3 py-2 text-xs" style={{ borderColor: "#2c2c28", color: "#a89f90" }}>{box.script}</p>
          {box.rows.map((person) => {
            const item = person.best;
            const clear = item.stats.n > 0 && item.stats.hits / item.stats.n >= 0.5;
            return (
            <button key={item.row.player + item.row.team} type="button" onClick={() => setOpenId(item.row.id)} className="flex min-h-11 w-full items-center gap-3 border-b px-3 py-2 text-left" style={{ borderColor: "#2c2c28" }}>
              {item.row.face ? <img src={item.row.face} alt="" className="size-9 shrink-0 rounded-full object-cover object-top" /> : <span className="size-9 shrink-0 rounded-full" style={{ background: "#2c2c28" }} />}
              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: item.row.confirmed ? "#f0eee6" : "#c45c4a" }}>{person.mates.some((m) => m.row.star) ? "★ " : ""}{item.row.player}</span>
              <span className="shrink-0 font-mono text-sm" style={{ color: clear ? "#3f6b45" : "#c45c4a" }}>{item.stats.hits}/{item.stats.n}</span>
            </button>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function Card({ item, number, onBack }: { item: PropItem; number: number; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("Trends");
  const [picked, setPicked] = useState(0);
  const last = item.games.slice(-10);
  const windows = (["L5", "L10", "Season"] as const).map((key) => ({ key, ...read(sliceOf(item.games, key), number) }));
  const season = read(item.games, number);
  const call = callFor(season.pct, season.n, item.confirmed);
  const play = last[picked] || last[last.length - 1];
  const scale = Math.max(number, ...last.map((g) => g.value), 1) * 1.15;
  return (
    <article className="border" style={{ borderColor: "#2c2c28", background: "#0e0e0c" }}>
      <button type="button" onClick={onBack} className="px-3 py-2 text-xs" style={{ color: "#a89f90" }}>Back to the list</button>
      <div className="flex items-center gap-3 px-3 pb-3">
        {item.face ? <img src={item.face} alt="" className="size-14 rounded-full object-cover object-top" /> : <span className="size-14 rounded-full" style={{ background: "#2c2c28" }} />}
        <div className="min-w-0">
          <h3 className="truncate text-xl font-medium" style={{ color: item.confirmed ? "#f0eee6" : "#c45c4a" }}>{item.player}</h3>
          <p className="text-sm" style={{ color: item.confirmed ? "#a89f90" : "#c45c4a" }}>{item.team} vs {item.opp}{item.when ? ` · ${item.when}` : ""}{item.confirmed ? "" : " · not confirmed in the lineup"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-y text-center" style={{ borderColor: "#2c2c28" }}>
        {item.season.slice(0, 3).map((s) => (
          <div key={s.label} className="px-2 py-2">
            <div className="font-mono">{s.value}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "#a89f90" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex border-b" style={{ borderColor: "#2c2c28" }}>
        {(["Trends", "Matchup", "Games"] as const).map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} className="min-h-11 flex-1 text-sm" style={{ color: tab === key ? "#f0eee6" : "#a89f90", borderBottom: tab === key ? "1px solid #f0eee6" : "1px solid transparent" }}>{key}</button>
        ))}
      </div>
      {tab === "Trends" ? (
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {windows.map((w) => (
              <div key={w.key} className="border px-1 py-2" style={{ borderColor: "#2c2c28" }}>
                <div className="text-[10px]" style={{ color: "#a89f90" }}>{w.key}</div>
                <div className="font-mono">{w.n ? `${w.hits}/${w.n}` : "—"}</div>
                <div className="font-mono text-xs" style={{ color: "#a89f90" }}>{w.n ? one(w.avg) : ""}</div>
              </div>
            ))}
          </div>
          <div className="relative h-40">
            <div className="absolute inset-x-0 border-t border-dashed" style={{ bottom: `${(number / scale) * 100}%`, borderColor: "#f0eee6" }} />
            <div className="flex h-full items-end gap-1 overflow-x-auto">
              {last.map((g, i) => {
                const over = g.value > number;
                return (
                  <button key={g.key} type="button" onClick={() => { setPicked(i); setTab("Games"); }} className="flex h-full w-9 shrink-0 flex-col items-center justify-end">
                    <span className="mb-0.5 font-mono text-[9px]" style={{ color: over ? "#3f6b45" : "#c45c4a" }}>{g.value}</span>
                    <span className="w-5" style={{ height: `${Math.max((g.value / scale) * 100, 4)}%`, background: over ? "#3f6b45" : "#c45c4a" }} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {last.map((g) => (
              <div key={g.key} className="w-9 shrink-0 text-center text-[9px]" style={{ color: "#a89f90" }}>
                <div>{g.date}</div>
                <div className="truncate">{g.opp}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "Matchup" ? <p className="p-3 text-sm leading-6">{item.matchup}</p> : null}
      {tab === "Games" ? (
        <p className="p-3 text-sm leading-6">{play ? play.box : "Click a bar."}</p>
      ) : null}
      <div className="space-y-1 border-t p-3 text-sm" style={{ borderColor: "#2c2c28" }}>
        <div className="flex justify-between"><span>Number</span><span className="font-mono">{one(number)} research</span></div>
        <div className="flex justify-between"><span>Open</span><span>not posted</span></div>
        <div className="flex justify-between"><span>Current</span><span>not posted</span></div>
        <div className="flex justify-between"><span>Book</span><span>not posted</span></div>
        <p style={{ color: "#a89f90" }}>No book is posted. This number is already the player’s own median.</p>
        {!item.confirmed ? <p style={{ color: "#c45c4a" }}>Not confirmed in the lineup.</p> : null}
        <p className="font-medium" style={{ color: tone(call) }}>{call}</p>
        <p className="leading-6" style={{ color: "#a89f90" }}>
          {item.player} cleared {season.hits}/{season.n} over {one(number)} in the logged games. The last 10 average {one(read(item.games.slice(-10), number).avg)}. {item.matchup} Not a book price, and there is no implied percent.
        </p>
      </div>
    </article>
  );
}
