"use client";

import { useEffect, useMemo, useState } from "react";

type Play = { week: string; def: string; yards: number | null; td: boolean };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; recent: Play[] };
type Side = { zonePct: number; manPct: number; snaps: number } | null;

const COLORS = ["#7c5cff", "#e85d4c", "#3ddc97", "#f0b429", "#5b8def", "#c084fc", "#22d3ee", "#fb7185"];

function gamesOf(p: Catcher) {
  const map = new Map<string, { yards: number; rec: number; td: number }>();
  for (const c of p.recent || []) {
    const row = map.get(c.week) || { yards: 0, rec: 0, td: 0 };
    row.yards += c.yards || 0;
    row.rec += 1;
    if (c.td) row.td += 1;
    map.set(c.week, row);
  }
  return Array.from(map.entries()).map(([week, v]) => ({ week, ...v }));
}

export function ReceiverLab({ away, home }: { away: string; home: string }) {
  const [catches, setCatches] = useState<Catcher[]>([]);
  const [defenses, setDefenses] = useState<{ away: Side; home: Side }>({ away: null, home: null });
  const [side, setSide] = useState(away);
  const [picked, setPicked] = useState("");

  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        setCatches(d.catches || []);
        setDefenses({ away: d.away, home: d.home });
        const first = (d.catches || []).find((p: Catcher) => p.team === away);
        setPicked(first?.name || "");
      })
      .catch(() => setCatches([]));
  }, [away, home]);

  const list = useMemo(() => catches.filter((p) => p.team === side).sort((a, b) => b.yards - a.yards), [catches, side]);
  const active = list.find((p) => p.name === picked) || list[0];
  const games = active ? gamesOf(active) : [];
  const median = games.length ? [...games].sort((a, b) => a.yards - b.yards)[Math.floor(games.length / 2)].yards : 0;
  const over = games.filter((g) => g.yards > median).length;
  const shareBase = list.reduce((s, p) => s + p.rec, 0) || 1;
  const opp = side === away ? home : away;
  const def = side === away ? defenses.home : defenses.away;
  const maxBar = Math.max(median, ...games.map((g) => g.yards), 1);

  if (!list.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121018]">
      <div className="bg-gradient-to-br from-[#5b2dff] to-[#24143f] px-4 py-4">
        <div className="text-[11px] uppercase tracking-wide text-white/70">{away} @ {home}</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white">{active.name}</h2>
            <p className="text-sm text-white/75">WR · Receiving yards · median {median}</p>
          </div>
          <div className="text-right text-xs text-white/80">
            <div className="font-mono text-lg text-white">{active.rec} / {active.yards}</div>
            <div>{active.td} TD</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {[away, home].map((t) => (
            <button key={t} type="button" onClick={() => { setSide(t); setPicked(""); }} className={`rounded-full px-3 py-1 text-xs ${side === t ? "bg-white text-[#24143f]" : "bg-white/10 text-white"}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        {list.map((p) => (
          <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs ${active.name === p.name ? "border-[#8b6cff] bg-[#8b6cff]/15 text-white" : "border-white/10 text-white/70"}`}>
            <div className="font-medium">{p.name}</div>
            <div className="font-mono text-[10px]">{p.rec} rec · {p.yards} yds</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 px-3">
        <Stat label="L5 hit" value={games.length ? `${Math.round((over / games.length) * 100)}%` : "—"} />
        <Stat label="Avg" value={String(Math.round(active.yards / Math.max(games.length, 1)))} />
        <Stat label="vs line" value={median ? `${median}` : "—"} />
      </div>
      <p className="px-3 pt-2 text-[11px] text-white/45">The line is his own median from charted 2026 catches, not a book number. No live odds feed on this page.</p>

      <div className="px-3 py-4">
        <div className="flex h-40 items-end gap-1.5">
          {games.slice(-8).map((g) => (
            <div key={g.week} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="font-mono text-[10px] text-white/80">{g.yards}</span>
              <div className={`w-full rounded-t-md ${g.yards >= median ? "bg-[#3ddc97]" : "bg-[#e85d4c]"}`} style={{ height: `${Math.max(8, (g.yards / maxBar) * 120)}px` }} />
              <span className="text-[9px] text-white/40">{g.week}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl border border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-white">Defense vs WR</span>
          <span className="text-white/50">{opp}</span>
        </div>
        <Row label="Zone" value={def ? `${def.zonePct}%` : "no chart"} tag={def && def.zonePct >= 60 ? "zone" : "mixed"} soft={!!def && def.zonePct >= 60} />
        <Row label="Man" value={def ? `${def.manPct}%` : "no chart"} tag={def && def.zonePct < 50 ? "man" : "mixed"} soft={!!def && def.zonePct < 50} />
        <Row label="Catches vs them" value={String((active.recent || []).filter((c) => c.def === opp).length)} tag="file" soft={false} />
        <Row label="Rec TD" value={String(active.td)} tag={active.td ? "scored" : "none"} soft={active.td > 0} />
      </div>

      <div className="mx-3 mb-4 rounded-xl border border-white/10 p-3">
        <div className="mb-3 text-xs font-medium text-white">Reception share</div>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: donut(list, shareBase) }}>
            <div className="absolute inset-3 grid place-items-center rounded-full bg-[#121018] text-center">
              <div className="font-mono text-sm text-white">{shareBase}</div>
              <div className="text-[9px] text-white/50">rec</div>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {list.slice(0, 6).map((p, i) => (
              <button key={p.name} type="button" onClick={() => setPicked(p.name)} className="flex w-full items-center gap-2 text-left text-[11px] text-white/80">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto font-mono">{Math.round((p.rec / shareBase) * 100)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-2 py-2 text-center">
      <div className="text-[10px] uppercase text-white/45">{label}</div>
      <div className="font-mono text-sm text-white">{value}</div>
    </div>
  );
}

function Row({ label, value, tag, soft }: { label: string; value: string; tag: string; soft: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-white/5 py-2 text-xs">
      <span className="text-white/70">{label}</span>
      <span className="font-mono text-white">{value}</span>
      <span className={`rounded px-1.5 py-0.5 text-[10px] ${soft ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/60"}`}>{tag}</span>
    </div>
  );
}

function donut(list: Catcher[], total: number) {
  let at = 0;
  const stops = list.slice(0, 8).map((p, i) => {
    const start = at;
    at += (p.rec / total) * 100;
    return `${COLORS[i % COLORS.length]} ${start}% ${at}%`;
  });
  return `conic-gradient(${stops.join(",")})`;
}
