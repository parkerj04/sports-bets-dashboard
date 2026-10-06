"use client";

import { useEffect, useState } from "react";
import { headshot, one, pct, summarize, teamLogo } from "@/components/builds/props-desk/data";

type Week = { week: number; td: number; opp: string };
type Scorer = { name: string; team: string; pos: string; id: string; total: number; scored: number; weeks: Week[] };
type Bar = { key: string; label: string; abbr: string; value: number | null };

const LOGO: Record<string, string> = { WAS: "WSH", LA: "LAR" };

function mark(abbr: string) {
  return teamLogo(LOGO[abbr] || abbr);
}

function read(p: Scorer, line: number) {
  const n = p.weeks.length;
  const spike = Math.max(0, ...p.weeks.map((w) => w.td));
  const over = p.weeks.filter((w) => w.td > line).length;
  const against = spike > 1 && spike * 2 > p.total
    ? `One game was ${spike} of the ${p.total} scores.`
    : over < n
      ? `${n - over} of ${n} logged games are under ${one(line)}.`
      : `${n} games. A full streak on a short log is not a price.`;
  const call = n < 3 ? "Pass — short log" : over === n ? "Scored over the line every logged game" : over * 2 >= n ? "No clear edge" : "More games under than over";
  return { call, against };
}

export function Scorers({ away, home, pending = false }: { away: string; home: string; pending?: boolean }) {
  const [players, setPlayers] = useState<Scorer[] | null>(null);
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [side, setSide] = useState(away);
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0.5);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    if (!away || !home) return;
    setPlayers(null);
    setLine(0.5);
    setPicked(null);
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        const rows: Scorer[] = d.players || [];
        setPlayers(rows);
        setSource(d.source || "");
        const first = rows.find((p) => p.team === away) || rows[0];
        setName(first?.name || "");
        setSide(first?.team || away);
      })
      .catch(() => setPlayers([]));
  }, [away, home]);

  if (!players) return <p className="text-xs text-muted">Loading the prop chart…</p>;
  const list = players.filter((p) => p.team === side);
  const active = list.find((p) => p.name === name) || list[0];
  const other = side === away ? home : away;
  const bars: Bar[] = active
    ? [
        ...active.weeks.map((w) => ({ key: `w${w.week}`, label: `W${w.week}`, abbr: w.opp, value: w.td })),
        ...(pending ? [{ key: "next", label: "Next", abbr: other, value: null }] : []),
      ]
    : [];
  const logged = bars.flatMap((b) => (b.value == null ? [] : [b.value]));
  const shown = summarize(logged, line);
  const note = active ? read(active, line) : null;
  const scale = Math.max(line, ...logged, 1) * 1.08;
  const linePct = (line / scale) * 100;
  const pickedBar = picked == null ? null : bars[picked];

  return (
    <section className="flex w-full flex-col gap-3">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent">Player props</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">Anytime touchdown</h2>
        <p className="mt-1 text-sm text-muted">The bar is the research line. A dashed bar is the game that has not been played.</p>
      </header>
      <div className="flex gap-1 rounded-full bg-background p-1 self-start">
        {[away, home].map((t) => (
          <button key={t} type="button" onClick={() => { setSide(t); setName(""); setPicked(null); setOpen(false); }} className={`min-h-11 rounded-full px-3 text-sm ${side === t ? "bg-accent text-foreground" : "text-muted"}`}>{t}</button>
        ))}
      </div>
      <div>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="card flex w-full items-center gap-3 p-3 text-left">
          {active?.id ? <img src={headshot(active.id)} alt="" className="size-11 rounded-full object-cover object-top ring-1 ring-card-border" /> : <span className="size-11 shrink-0 rounded-full bg-background" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{active ? active.name : "No scorer on file"}</span>
            <span className="text-sm text-muted">{active ? `${active.team} · ${active.pos} · Anytime TD` : side}</span>
          </span>
          <span className="text-sm text-muted">{open ? "Close" : "Open"}</span>
        </button>
        {open ? (
          <ul className="card mt-2 max-h-80 overflow-y-auto p-1">
            {list.map((p) => (
              <li key={p.name}>
                <button type="button" onClick={() => { setName(p.name); setOpen(false); setPicked(null); }} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${p.name === active?.name ? "bg-accent/30" : ""}`}>
                  {p.id ? <img src={headshot(p.id)} alt="" className="size-8 rounded-full object-cover object-top" /> : <span className="size-8 rounded-full bg-background" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted">{p.pos} · {p.total} TD in {p.weeks.length}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {active && note ? (
        <>
          <header className="card overflow-hidden">
            <div className="bg-accent/30 px-4 py-4">
              <div className="flex items-center gap-3">
                {active.id ? <img src={headshot(active.id)} alt="" className="size-16 rounded-full object-cover object-top ring-1 ring-card-border" /> : null}
                <div>
                  <h3 className="text-2xl font-semibold">{active.name}</h3>
                  <p className="text-sm text-muted">{active.pos} · {active.team} · Anytime TD</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
                  <div className="font-mono text-3xl font-semibold">{one(line)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg text-good">{shown.n ? `${shown.hits}/${shown.n} over` : "No games"}</div>
                  <div className="text-xs text-muted">{shown.n ? `${pct(shown.pct)} · avg ${one(shown.avg)}` : ""} · 2026</div>
                </div>
              </div>
            </div>
          </header>
          <section className="card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-semibold">Game log</h3>
              <span className="text-xs text-muted">Dashed bar has not been played</span>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="relative" style={{ width: Math.max(bars.length * 52, 280) }}>
                <div className="relative h-52">
                  <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-foreground" style={{ bottom: `${linePct}%` }}>
                    <span className="absolute -top-3 right-0 rounded-full bg-foreground px-2 py-0.5 font-mono text-xs font-semibold text-background">{one(line)}</span>
                  </div>
                  <div className="flex h-full items-end">
                    {bars.map((b, i) => {
                      const pendingBar = b.value == null;
                      const height = pendingBar ? 36 : Math.max((b.value! / scale) * 100, b.value === 0 ? 3 : 8);
                      const over = !pendingBar && b.value! > line;
                      const inside = !pendingBar && height > 24;
                      return (
                        <button key={b.key} type="button" onClick={() => setPicked(i)} aria-pressed={picked === i} className="relative h-full w-12 shrink-0">
                          {!pendingBar && !inside ? (
                            <span className={`absolute inset-x-0 text-center font-mono text-xs font-semibold ${over ? "text-good" : "text-danger"}`} style={{ bottom: `calc(${height}% + 2px)` }}>{b.value}</span>
                          ) : null}
                          <span className={`absolute inset-x-1 bottom-0 rounded-md ${pendingBar ? "border border-dashed border-muted" : over ? "bg-good" : "bg-danger"} ${picked === i ? "ring-2 ring-foreground" : ""}`} style={{ height: `${height}%` }}>
                            {pendingBar ? <span className="grid h-full place-items-center text-sm text-muted">?</span> : inside ? <span className="block pt-1 text-center font-mono text-xs font-semibold text-background">{b.value}</span> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 flex">
                  {bars.map((b) => (
                    <div key={`${b.key}-m`} className="flex w-12 shrink-0 flex-col items-center">
                      <img src={mark(b.abbr)} alt="" className="size-6" />
                      <span className="mt-1 text-center text-xs leading-none text-muted">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {pickedBar && pickedBar.value != null ? (
              <p className="mt-3 text-sm">Week {pickedBar.label.replace("W", "")} vs {pickedBar.abbr}: <span className="font-mono">{pickedBar.value}</span> is {pickedBar.value > line ? "over" : "under"} {one(line)}.</p>
            ) : (
              <p className="mt-3 text-xs text-muted">Tap a bar. The line starts at 0.5, which is one touchdown.</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Lower the line" onClick={() => setLine((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}>−</button>
              <input className="h-11 min-w-0 flex-1 accent-accent" type="range" min={0} max={Math.max(3, Math.ceil(Math.max(line, ...logged)))} step={0.5} value={line} aria-label="Research line" onChange={(e) => setLine(Number(e.target.value))} />
              <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Raise the line" onClick={() => setLine((v) => Math.round((v + 0.5) * 10) / 10)}>+</button>
            </div>
          </section>
          <section className="card p-4">
            <p className="text-xs uppercase tracking-widest text-accent">Desk call</p>
            <h3 className="mt-1 text-2xl font-semibold">{note.call}</h3>
            <p className="mt-2 text-sm text-muted">{note.against}</p>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">No 2026 rushing or receiving touchdown on file for {side}.</p>
      )}
      <p className="text-xs text-muted">{source}</p>
    </section>
  );
}
