"use client";

import { useEffect, useState } from "react";
import { headshot, one, pct, summarize, teamLogo } from "./data";

type Week = { week: number; td: number; rec: number; rush: number; catches: number; pass: number; passTd: number; opp: string };
type Player = {
  name: string;
  team: string;
  pos: string;
  id: string;
  rec: number;
  rush: number;
  catches: number;
  pass: number;
  passTd: number;
  total: number;
  weeks: Week[];
  models?: Partial<Record<Market | "td", { value: number; text: string }>>;
};
type Market = "rec" | "catches" | "rush" | "pass" | "passTd";

const MARKETS: { key: Market; label: string }[] = [
  { key: "rec", label: "Receiving yards" },
  { key: "catches", label: "Receptions" },
  { key: "rush", label: "Rushing yards" },
  { key: "pass", label: "Passing yards" },
  { key: "passTd", label: "Passing TDs" },
];

const LOGO: Record<string, string> = { WAS: "WSH", LA: "LAR" };

function mark(abbr: string) {
  return teamLogo(LOGO[abbr] || abbr);
}

function statOf(week: Week, market: Market) {
  if (market === "rec") return week.rec;
  if (market === "catches") return week.catches;
  if (market === "rush") return week.rush;
  if (market === "pass") return week.pass;
  return week.passTd;
}

function totalOf(player: Player, market: Market) {
  if (market === "rec") return player.rec;
  if (market === "catches") return player.catches;
  if (market === "rush") return player.rush;
  if (market === "pass") return player.pass;
  return player.passTd;
}

function inMarket(player: Player, market: Market) {
  if (market === "pass" || market === "passTd") return player.pass > 0 || player.passTd > 0;
  return totalOf(player, market) > 0;
}

function lineFor(values: number[]) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return Math.round(mid * 2) / 2;
}

function ModelBox({ model }: { model?: { value: number; text: string } }) {
  if (!model) return null;
  return (
    <div className="mt-4 rounded-xl bg-background p-3">
      <div className="text-xs uppercase tracking-widest text-accent">Protected model</div>
      <div className="font-mono text-3xl font-semibold">{model.value.toFixed(1)}</div>
      <p className="mt-1 text-sm text-muted">{model.text}</p>
    </div>
  );
}

function read(values: number[], line: number) {
  const s = summarize(values, line);
  const max = values.length ? Math.max(...values) : 0;
  const against = values.length > 1 && max > line && max >= s.avg * 1.8
    ? `One game was ${one(max)}. That game is carrying the log.`
    : s.hits < s.n
      ? `${s.n - s.hits} of ${s.n} logged games are under ${one(line)}.`
      : `${s.n} games. A full streak on a short log is not a price.`;
  const call = s.n < 3 ? "Pass — short log" : s.hits === s.n ? "Cleared the line every logged game" : s.hits * 2 >= s.n ? "No clear edge" : "More games under than over";
  return { call, against, ...s };
}

function Bars({ weeks, values, line, pendingOpp }: { weeks: { label: string; abbr: string; value: number | null }[]; values: number[]; line: number; pendingOpp?: string }) {
  const bars = pendingOpp ? [...weeks, { label: "Next", abbr: pendingOpp, value: null }] : weeks;
  const scale = Math.max(line, ...values, 1) * 1.08;
  const linePct = (line / scale) * 100;
  const [picked, setPicked] = useState<number | null>(null);
  const bar = picked == null ? null : bars[picked];
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="relative" style={{ width: Math.max(bars.length * 52, 280) }}>
          <div className="relative h-52">
            <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-foreground" style={{ bottom: `${linePct}%` }}>
              <span className="absolute -top-3 right-0 rounded-full bg-foreground px-2 py-0.5 font-mono text-xs font-semibold text-background">{one(line)}</span>
            </div>
            <div className="flex h-full items-end">
              {bars.map((b, i) => {
                const empty = b.value == null;
                const height = empty ? 36 : Math.max((b.value! / scale) * 100, b.value === 0 ? 3 : 8);
                const over = !empty && b.value! > line;
                const inside = !empty && height > 24;
                return (
                  <button key={`${b.label}-${i}`} type="button" onClick={() => setPicked(i)} className="relative h-full w-12 shrink-0">
                    {!empty && !inside ? <span className={`absolute inset-x-0 text-center font-mono text-xs font-semibold ${over ? "text-good" : "text-danger"}`} style={{ bottom: `calc(${height}% + 2px)` }}>{b.value}</span> : null}
                    <span className={`absolute inset-x-1 bottom-0 rounded-md ${empty ? "border border-dashed border-muted" : over ? "bg-good" : "bg-danger"} ${picked === i ? "ring-2 ring-foreground" : ""}`} style={{ height: `${height}%` }}>
                      {empty ? <span className="grid h-full place-items-center text-sm text-muted">?</span> : inside ? <span className="block pt-1 text-center font-mono text-xs font-semibold text-background">{b.value}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex">
            {bars.map((b, i) => (
              <div key={`${b.label}-m-${i}`} className="flex w-12 shrink-0 flex-col items-center">
                <img src={mark(b.abbr)} alt="" className="size-6" />
                <span className="mt-1 text-center text-xs leading-none text-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">
        {bar && bar.value != null ? `${bar.label} vs ${bar.abbr}: ${bar.value} is ${bar.value > line ? "over" : "under"} ${one(line)}.` : "Tap a bar. The dashed bar has not been played."}
      </p>
    </div>
  );
}

export function AnytimeSection({ away, home, pending = false }: { away: string; home: string; pending?: boolean }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0.5);

  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        const rows: Player[] = (d.players || []).filter((p: Player) => p.total > 0);
        setPlayers(rows);
        setName(rows[0]?.name || "");
      })
      .catch(() => setPlayers([]));
  }, [away, home]);

  const active = players?.find((p) => p.name === name) || players?.[0];
  const values = active ? active.weeks.map((w) => w.td) : [];
  const shown = summarize(values, line);
  const note = values.length ? read(values, line) : null;

  return (
    <section className="card p-4">
      <p className="text-xs uppercase tracking-widest text-accent">Subsection</p>
      <h3 className="mt-1 font-semibold">Anytime TD</h3>
      <p className="mt-1 text-sm text-muted">Same players, rushing plus receiving scores. The line starts at 0.5, which is one touchdown.</p>
      {!players ? <p className="mt-3 text-sm text-muted">Loading scorers…</p> : null}
      {players && !active ? <p className="mt-3 text-sm text-muted">No 2026 touchdown on file for these teams.</p> : null}
      {active ? (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="card mt-3 flex w-full items-center gap-3 p-3 text-left">
            {active.id ? <img src={headshot(active.id)} alt="" className="size-11 rounded-full object-cover object-top" /> : <span className="size-11 rounded-full bg-background" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{active.name}</span>
              <span className="text-sm text-muted">{active.team} · {active.pos} · {active.total} TD</span>
            </span>
            <span className="text-sm text-muted">{open ? "Close" : "Open"}</span>
          </button>
          {open ? (
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {players!.map((p) => (
                <li key={p.name}>
                  <button type="button" onClick={() => { setName(p.name); setOpen(false); setLine(0.5); }} className="flex min-h-11 w-full items-center gap-3 py-2 text-left">
                    {p.id ? <img src={headshot(p.id)} alt="" className="size-8 rounded-full object-cover object-top" /> : <span className="size-8 rounded-full bg-background" />}
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                    <span className="font-mono text-sm text-muted">{p.total}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
              <div className="font-mono text-3xl font-semibold">{one(line)}</div>
            </div>
            <div className="text-right font-mono text-sm text-good">{shown.n ? `${shown.hits}/${shown.n} over` : ""}</div>
          </div>
          <div className="mt-3">
            <Bars
              line={line}
              values={values}
              pendingOpp={pending ? (active.team === away ? home : away) : undefined}
              weeks={active.weeks.map((w) => ({ label: `W${w.week}`, abbr: w.opp, value: w.td }))}
            />
          </div>
          {note ? <p className="mt-2 text-sm text-muted">{note.call}. {note.against}</p> : null}
          <ModelBox model={active.models?.td} />
        </>
      ) : null}
    </section>
  );
}

export function LiveBoard({ away, home, pending = false }: { away: string; home: string; pending?: boolean }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [source, setSource] = useState("");
  const [market, setMarket] = useState<Market>("rec");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(true);
  const [line, setLine] = useState(0.5);

  useEffect(() => {
    if (!away || !home) return;
    setPlayers(null);
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => { setPlayers(d.players || []); setSource(d.source || ""); })
      .catch(() => setPlayers([]));
  }, [away, home]);

  const list = (players || [])
    .filter((p) => inMarket(p, market))
    .sort((a, b) => totalOf(b, market) - totalOf(a, market));
  const active = list.find((p) => p.name === name) || null;
  const values = active ? active.weeks.map((w) => statOf(w, market)) : [];
  const shown = active ? read(values, line) : null;

  function pickMarket(next: Market) {
    setMarket(next);
    setName("");
    setOpen(true);
    setLine(0.5);
  }

  function pickPlayer(player: Player) {
    const nums = player.weeks.map((w) => statOf(w, market));
    setName(player.name);
    setOpen(false);
    setLine(lineFor(nums));
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent">Player props</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{away} @ {home}</h2>
        <p className="mt-1 text-sm text-muted">Receiving, rushing, and passing. The line is the median of the 2026 games, snapped to .5.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {MARKETS.map((item) => (
          <button key={item.key} type="button" onClick={() => pickMarket(item.key)} className={`min-h-11 rounded-full px-3 text-sm ${market === item.key ? "bg-accent text-foreground" : "bg-background text-muted"}`}>{item.label}</button>
        ))}
      </div>
      {!players ? <p className="text-sm text-muted">Loading the prop board…</p> : null}
      {players ? (
        <div>
          <button type="button" onClick={() => setOpen((v) => !v)} className="card flex w-full items-center gap-3 p-3 text-left">
            {active?.id ? <img src={headshot(active.id)} alt="" className="size-11 rounded-full object-cover object-top" /> : <span className="size-11 shrink-0 rounded-full bg-background" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{active ? active.name : "Choose a player"}</span>
              <span className="text-sm text-muted">{active ? `${active.team} · ${active.pos} · ${MARKETS.find((m) => m.key === market)?.label}` : `${list.length} players`}</span>
            </span>
            <span className="text-sm text-muted">{open ? "Close" : "Open"}</span>
          </button>
          {open ? (
            <ul className="card mt-2 max-h-80 overflow-y-auto p-1">
              {list.map((p) => (
                <li key={`${p.team}-${p.name}`}>
                  <button type="button" onClick={() => pickPlayer(p)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-2 text-left">
                    {p.id ? <img src={headshot(p.id)} alt="" className="size-8 rounded-full object-cover object-top" /> : <span className="size-8 rounded-full bg-background" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted">{p.team} · {p.pos}</span>
                    </span>
                    <span className="font-mono text-sm">{totalOf(p, market)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {active && shown ? (
        <section className="card p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
              <div className="font-mono text-3xl font-semibold">{one(line)}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg text-good">{shown.n ? `${shown.hits}/${shown.n} over` : "No games"}</div>
              <div className="text-xs text-muted">{shown.n ? `${pct(shown.pct)} · avg ${one(shown.avg)}` : ""} · 2026</div>
            </div>
          </div>
          <div className="mt-3">
            <Bars
              line={line}
              values={values}
              pendingOpp={pending ? (active.team === away ? home : away) : undefined}
              weeks={active.weeks.map((w) => ({ label: `W${w.week}`, abbr: w.opp, value: statOf(w, market) }))}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Lower the line" onClick={() => setLine((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}>−</button>
            <input className="h-11 min-w-0 flex-1 accent-accent" type="range" min={0} max={Math.max(line, ...values, 10)} step={0.5} value={line} aria-label="Research line" onChange={(e) => setLine(Number(e.target.value))} />
            <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Raise the line" onClick={() => setLine((v) => Math.round((v + 0.5) * 10) / 10)}>+</button>
          </div>
          <p className="mt-3 text-sm text-muted">{shown.call}. {shown.against}</p>
          <ModelBox model={active.models?.[market]} />
        </section>
      ) : null}
      <AnytimeSection away={away} home={home} pending={pending} />
      <p className="text-xs text-muted">{source}</p>
    </section>
  );
}
