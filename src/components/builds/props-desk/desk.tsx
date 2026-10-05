"use client";

import { useMemo, useState } from "react";
import {
  DVP,
  FALCONS_RUSH,
  FALCONS_TARGETS,
  PROPS,
  headshot,
  one,
  ordinal,
  pct,
  summarize,
  teamLogo,
  type ChartBar,
  type Pos,
  type PropCard,
} from "./data";

export function PropsDesk() {
  const [slug, setSlug] = useState<string | null>(null);
  const prop = PROPS.find((p) => p.slug === slug) ?? null;
  return prop ? <Card prop={prop} onBack={() => setSlug(null)} /> : <Board onOpen={setSlug} />;
}

function Board({ onOpen }: { onOpen: (slug: string) => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent">Build · not the member board</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Falcons @ Saints</h1>
        <p className="mt-1 text-sm text-muted">Mon 8:15 PM ET · Week 4 · ESPN logs through Week 3. Lines are research bars, not book prices.</p>
      </header>
      <ul className="flex flex-col gap-3">
        {PROPS.map((prop) => {
          const season = summarize(prop.games, prop.line);
          return (
            <li key={prop.slug}>
              <button type="button" onClick={() => onOpen(prop.slug)} className="card flex w-full items-center gap-3 p-3 text-left">
                <Head id={prop.espnId} name={prop.player} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{prop.player}</span>
                  <span className="text-sm text-muted">
                    {prop.pos} · {prop.market} · {one(prop.line)}
                  </span>
                </span>
                <span className="text-right">
                  <span className={`block font-mono text-sm ${season.pct >= 0.5 ? "text-good" : "text-danger"}`}>
                    {season.hits}/{season.n}
                  </span>
                  <span className="block text-xs text-muted">{prop.call}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Card({ prop, onBack }: { prop: PropCard; onBack: () => void }) {
  const [line, setLine] = useState(prop.line);
  const foe: "ATL" | "NO" = prop.team === "ATL" ? "NO" : "ATL";
  const logged = useMemo(() => prop.chart.flatMap((b) => (b.value == null ? [] : [b.value])), [prop.chart]);
  const vsFoe = useMemo(
    () => prop.chart.flatMap((b) => (b.abbr === foe && b.value != null ? [b.value] : [])),
    [prop.chart, foe],
  );
  const summary = summarize(logged, line);
  const windows = [
    { label: "L5", ...summarize(logged.slice(-5), line) },
    { label: "L10", ...summarize(logged.slice(-10), line) },
    { label: "2026", ...summarize(prop.games, line) },
    { label: `vs ${foe}`, ...summarize(vsFoe, line) },
  ];
  const maxLine = Math.max(line, ...logged, 40);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4 pb-16">
      <button type="button" onClick={onBack} className="min-h-11 self-start text-sm font-medium">
        ← Board
      </button>
      <header className="card overflow-hidden">
        <div className="bg-accent/30 px-4 py-4">
          <p className="text-xs text-muted">ATL @ NO · Mon 8:15 PM ET</p>
          <div className="mt-3 flex items-center gap-3">
            <Head id={prop.espnId} name={prop.player} large />
            <div>
              <h1 className="text-2xl font-semibold">{prop.player}</h1>
              <p className="text-sm text-muted">
                {prop.pos} · {prop.team} · {prop.market}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
              <div className="font-mono text-3xl font-semibold">{one(line)}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg text-good">
                {summary.hits}/{summary.n} over
              </div>
              <div className="text-xs text-muted">
                {pct(summary.pct)} · avg {one(summary.avg)} · median {one(summary.mid)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Game log</h2>
          <span className="text-xs text-muted">Dashed bar is tonight</span>
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {windows.map((w) => (
            <div
              key={w.label}
              className={`min-w-16 shrink-0 rounded-xl px-2 py-2 text-center ${w.label === "L10" ? "bg-accent/30 ring-1 ring-accent" : "bg-background"}`}
            >
              <div className="text-xs text-muted">{w.label}</div>
              <div className={`font-mono text-sm font-semibold ${w.n && w.pct >= 0.5 ? "text-good" : "text-danger"}`}>
                {w.n ? pct(w.pct) : "—"}
              </div>
              <div className="font-mono text-xs text-muted">{w.n ? `Avg ${one(w.avg)}` : "No games"}</div>
            </div>
          ))}
        </div>
        <LineLog bars={prop.chart} line={line} />
        <label className="mt-4 block text-xs text-muted">
          Line
          <input
            className="mt-1 h-11 w-full accent-accent"
            type="range"
            min={0}
            max={Math.ceil(maxLine / 5) * 5}
            step={0.5}
            value={line}
            aria-label="Research line"
            onChange={(e) => setLine(Number(e.target.value))}
          />
        </label>
        <p className="mt-1 text-xs text-muted">{prop.lineNote} Last 10 logged games, then tonight.</p>
      </section>

      <Defense foe={foe} pos={prop.pos} market={prop.market} />
      {prop.team === "ATL" ? <Share player={prop.player} /> : null}
      <section className="card p-4">
        <p className="text-xs uppercase tracking-widest text-accent">Desk call</p>
        <h2 className="mt-1 text-2xl font-semibold">{prop.call}</h2>
        <p className="mt-2 text-sm text-muted">{prop.callWhy}</p>
      </section>
      <Split title="Case for" tone="good" items={prop.bulletsFor} />
      <Split title="Case against" tone="danger" items={prop.bulletsAgainst} />
    </main>
  );
}

function LineLog({ bars, line }: { bars: ChartBar[]; line: number }) {
  const nums = bars.flatMap((b) => (b.value == null ? [] : [b.value]));
  const scale = Math.max(line, ...nums, 1) * 1.08;
  const linePct = (line / scale) * 100;
  return (
    <div className="overflow-x-auto pb-1">
      <div className="relative" style={{ width: Math.max(bars.length * 52, 320) }}>
        <div className="relative h-52">
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-foreground" style={{ bottom: `${linePct}%` }}>
            <span className="absolute -top-3 right-0 rounded-full bg-foreground px-2 py-0.5 font-mono text-xs font-semibold text-background">
              {one(line)}
            </span>
          </div>
          <div className="flex h-full items-end">
            {bars.map((b) => {
              const pending = b.value == null;
              const height = pending ? 36 : Math.max((b.value! / scale) * 100, b.value === 0 ? 3 : 8);
              const over = !pending && b.value! > line;
              const inside = !pending && height > 24;
              return (
                <div key={`${b.date}-${b.abbr}`} className="relative h-full w-12 shrink-0">
                  {!pending && !inside ? (
                    <span
                      className={`absolute inset-x-0 text-center font-mono text-xs font-semibold ${over ? "text-good" : "text-danger"}`}
                      style={{ bottom: `calc(${height}% + 2px)` }}
                    >
                      {b.value}
                    </span>
                  ) : null}
                  <div
                    className={`absolute inset-x-1 bottom-0 rounded-md ${pending ? "border border-dashed border-muted" : over ? "bg-good" : "bg-danger"}`}
                    style={{ height: `${height}%` }}
                  >
                    {pending ? (
                      <span className="grid h-full place-items-center text-sm text-muted">?</span>
                    ) : inside ? (
                      <span className="block pt-1 text-center font-mono text-xs font-semibold text-background">{b.value}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex">
          {bars.map((b) => (
            <div key={`${b.date}-${b.abbr}-m`} className="flex w-12 shrink-0 flex-col items-center">
              <img src={teamLogo(b.abbr)} alt="" className="size-6" />
              <span className="mt-1 text-center text-xs leading-none text-muted">{b.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Defense({ foe, pos, market }: { foe: "ATL" | "NO"; pos: Pos; market: string }) {
  const [spot, setSpot] = useState<Pos>(pos);
  const [kind, setKind] = useState<"rec" | "rush">(market.startsWith("Rush") ? "rush" : "rec");
  const slice = DVP[foe][spot];
  const rows =
    kind === "rush"
      ? [
          { key: "car", label: "Carries" },
          { key: "ryds", label: "Rush yds" },
        ]
      : [
          { key: "rec", label: "Receptions" },
          { key: "tgt", label: "Targets" },
          { key: "yds", label: "Rec yds" },
        ];
  const rushable = spot === "RB" || spot === "QB";
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Defense vs position</h2>
        <span className="text-xs text-muted">2026 · ESPN box scores</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(["QB", "RB", "WR", "TE"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`min-h-11 rounded-full px-3 text-sm ${spot === p ? "bg-accent text-foreground" : "bg-background text-muted"}`}
            onClick={() => {
              setSpot(p);
              if (p === "WR" || p === "TE") setKind("rec");
            }}
          >
            {p}
          </button>
        ))}
        {rushable ? (
          <button type="button" className="min-h-11 rounded-full bg-background px-3 text-sm text-muted" onClick={() => setKind(kind === "rec" ? "rush" : "rec")}>
            {kind === "rec" ? "Show rushing" : "Show receiving"}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted">
        {foe} allows to <span className="font-medium text-foreground">{spot}</span>
      </p>
      <ul className="mt-3 flex flex-col gap-4">
        {rows.map((row) => {
          const cell = slice[row.key];
          if (!cell) return null;
          const grade = cell.rank >= 24 ? "Soft" : cell.rank <= 10 ? "Tough" : "Mid";
          const tone = grade === "Soft" ? "text-good" : grade === "Tough" ? "text-danger" : "text-muted";
          const bar = grade === "Soft" ? "bg-good" : grade === "Tough" ? "bg-danger" : "bg-accent";
          return (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{row.label}</span>{" "}
                  <span className="font-mono text-muted">{one(cell.per)} allowed</span>
                </span>
                <span>
                  <span className="font-mono text-muted">{ordinal(cell.rank)}</span> <span className={`font-semibold ${tone}`}>{grade}</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                <div className={`h-full rounded-full ${bar}`} style={{ width: `${(cell.rank / 32) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Rank 1 is fewest allowed. Soft is 24th or worse. New Orleans and Atlanta have 3 games. Not red zone.</p>
    </section>
  );
}

function Share({ player }: { player: string }) {
  const [mode, setMode] = useState<"targets" | "rush">("targets");
  const total = mode === "targets" ? FALCONS_TARGETS.reduce((a, m) => a + m.targets, 0) : FALCONS_RUSH.reduce((a, m) => a + m.yards, 0);
  const stops =
    mode === "targets"
      ? conic(FALCONS_TARGETS.map((m) => ({ value: m.targets, color: m.color })))
      : conic(FALCONS_RUSH.map((m) => ({ value: m.yards, color: m.color })));
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Falcons share</h2>
        <div className="flex gap-1 rounded-full bg-background p-1">
          <button type="button" className={`min-h-11 rounded-full px-3 text-sm ${mode === "targets" ? "bg-accent" : "text-muted"}`} onClick={() => setMode("targets")}>
            Targets
          </button>
          <button type="button" className={`min-h-11 rounded-full px-3 text-sm ${mode === "rush" ? "bg-accent" : "text-muted"}`} onClick={() => setMode("rush")}>
            Rush
          </button>
        </div>
      </div>
      <div className="relative mx-auto mt-4 size-56 rounded-full" style={{ background: stops }}>
        <div className="absolute inset-8 grid place-items-center rounded-full bg-card text-center">
          <div>
            <div className="font-mono text-3xl font-semibold">{total}</div>
            <div className="text-xs text-muted">{mode === "targets" ? "Total targets" : "Rush yards"}</div>
          </div>
        </div>
      </div>
      {mode === "targets" ? (
        <ul className="mt-4">
          {FALCONS_TARGETS.map((m) => {
            const on = m.name === player;
            return (
              <li key={m.name} className={`flex items-center gap-2 rounded-xl px-1 py-1.5 ${on ? "bg-accent/25" : ""}`}>
                <span className="size-2 shrink-0 rounded-full" style={{ background: m.color }} />
                <Head id={m.espnId} name={m.name} compact />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted">{m.pos}</span>
                </span>
                <span className="font-mono text-sm">{m.targets}</span>
                <span className="w-14 text-right font-mono text-sm text-muted">{pct(m.targets / total)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-4 text-sm">
          {FALCONS_RUSH.map((m) => (
            <li key={m.name} className="flex justify-between py-2">
              <span>
                {m.name} <span className="text-muted">{m.carries} car</span>
              </span>
              <span className="font-mono">
                {m.yards} · {pct(m.yards / total)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Player logs sum to 76 targets. ESPN’s Falcons team total is 75. Not red zone.</p>
    </section>
  );
}

function conic(parts: { value: number; color: string }[]) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const stops = parts.map((p) => {
    const start = acc;
    acc += (p.value / total) * 100;
    return `${p.color} ${start}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(",")})`;
}

function Split({ title, tone, items }: { title: string; tone: "good" | "danger"; items: string[] }) {
  return (
    <section className="card p-4">
      <h3 className={`text-sm font-semibold ${tone === "good" ? "text-good" : "text-danger"}`}>{title}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-muted">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Head({ id, name, large = false, compact = false }: { id: string; name: string; large?: boolean; compact?: boolean }) {
  const size = large ? "size-16" : compact ? "size-8" : "size-11";
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-background ring-1 ring-card-border ${size}`}>
      <img src={headshot(id)} alt="" className="absolute inset-0 size-full object-cover object-top" />
    </span>
  );
}
