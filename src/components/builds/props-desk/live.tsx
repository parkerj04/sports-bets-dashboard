"use client";

import { useEffect, useState } from "react";
import { headshot, one, pct, summarize, teamLogo } from "./data";
import { PropRank, type PropItem } from "@/components/PropRank";

type Week = { week: number; date?: string; td: number; rec: number; rush: number; catches: number; pass: number; passTd: number; opp: string };
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

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function playedOn(date?: string, week?: number) {
  if (date && date.includes("-")) {
    const [, m, d] = date.split("-");
    return `${MONTHS[Number(m)] || ""} ${Number(d)}`.trim();
  }
  return week ? `W${week}` : "";
}

const LOGO: Record<string, string> = { WAS: "WSH", LA: "LAR" };

function mark(abbr: string) {
  return teamLogo(LOGO[abbr] || abbr);
}

type BoardMarket = Market | "td";

const BOARD: { key: BoardMarket; label: string }[] = [
  { key: "catches", label: "Rec" },
  { key: "rec", label: "Rec yds" },
  { key: "rush", label: "Rush" },
  { key: "td", label: "Anytime TD" },
  { key: "pass", label: "Pass yds" },
  { key: "passTd", label: "Pass TD" },
];

function statOf(week: Week, market: BoardMarket) {
  if (market === "td") return week.td;
  if (market === "rec") return week.rec;
  if (market === "catches") return week.catches;
  if (market === "rush") return week.rush;
  if (market === "pass") return week.pass;
  return week.passTd;
}

function plays(player: Player, market: BoardMarket) {
  if (market === "pass" || market === "passTd") return player.pass > 0 || player.passTd > 0;
  if (market === "td") return player.weeks.length > 0;
  return player.weeks.some((week) => statOf(week, market) > 0);
}

function takeWeeks(weeks: Week[], win: "L5" | "L10" | "L15" | "2026" | "H2H", foe: string) {
  if (win === "H2H") return weeks.filter((week) => week.opp === foe);
  if (win === "2026") return weeks;
  const n = win === "L5" ? 5 : win === "L10" ? 10 : 15;
  return weeks.slice(-n);
}

function lineFor(values: number[]) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return Math.round(mid * 2) / 2;
}

const UNIT: Record<Market, string> = {
  rec: "receiving yards",
  catches: "receptions",
  rush: "rushing yards",
  pass: "passing yards",
  passTd: "passing touchdowns",
};

function rateModel(player: Player, market: Market, values: number[]) {
  if (!values.length) return undefined;
  const rate = values.reduce((sum, n) => sum + n, 0) / values.length;
  const value = Math.round(rate * 10) / 10;
  return {
    value,
    text: `${player.name} projects to ${value.toFixed(1)} ${UNIT[market]}. That is the average of ${values.length} logged 2026 games. No defense sample was attached to this card, so nothing else was added. Not a book price.`,
  };
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
        <div className="relative" style={{ width: Math.max(bars.length * 58, 280) }}>
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
                  <button key={`${b.label}-${i}`} type="button" onClick={() => setPicked(i)} className="relative h-full w-14 shrink-0">
                    {!empty && !inside ? <span className={`absolute inset-x-0 text-center font-mono text-xs font-semibold ${over ? "text-good" : "text-danger"}`} style={{ bottom: `calc(${height}% + 2px)` }}>{b.value}</span> : null}
                    <span className={`absolute inset-x-1.5 bottom-0 rounded-md ${empty ? "border border-dashed border-accent/50" : over ? "bg-good" : "bg-danger"} ${picked === i ? "ring-2 ring-accent" : ""}`} style={{ height: `${height}%` }}>
                      {empty ? <span className="grid h-full place-items-center text-sm text-muted">?</span> : inside ? <span className="block pt-1 text-center font-mono text-xs font-semibold text-background">{b.value}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex">
            {bars.map((b, i) => (
              <div key={`${b.label}-m-${i}`} className="flex w-14 shrink-0 flex-col items-center">
                <span className={`grid size-8 place-items-center rounded-full bg-background ring-1 ${picked === i ? "ring-accent" : "ring-card-border"}`}>
                  <img src={mark(b.abbr)} alt="" className="size-5 object-contain" />
                </span>
                <span className="mt-1 text-center font-mono text-[10px] leading-none text-muted">{b.label}</span>
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
  const [side, setSide] = useState(away);

  useEffect(() => {
    if (!away || !home) return;
    setSide(away);
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        const rows: Player[] = (d.players || []).filter((p: Player) => p.total > 0);
        setPlayers(rows);
        setName(rows.find((p) => p.team === away)?.name || "");
      })
      .catch(() => setPlayers([]));
  }, [away, home]);

  const roster = (players || []).filter((p) => p.team === side).sort((a, b) => a.name.localeCompare(b.name));
  const active = roster.find((p) => p.name === name) || null;
  const values = active ? active.weeks.map((w) => w.td) : [];
  const shown = summarize(values, line);
  const note = values.length ? read(values, line) : null;

  return (
    <section className="card p-4">
      <p className="text-xs uppercase tracking-widest text-accent">Subsection</p>
      <h3 className="mt-1 font-semibold">Anytime TD</h3>
      <p className="mt-1 text-sm text-muted">Same players, rushing plus receiving scores. The line starts at 0.5, which is one touchdown.</p>
      <div className="mt-3 flex gap-2">
        {[away, home].map((team) => (
          <button key={team} type="button" onClick={() => { setSide(team); setName(""); setOpen(true); }} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm ${side === team ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
            <img src={mark(team)} alt="" className="size-5 object-contain" />
            {team}
          </button>
        ))}
      </div>
      {!players ? <p className="mt-3 text-sm text-muted">Loading scorers…</p> : null}
      {players && roster.length === 0 ? <p className="mt-3 text-sm text-muted">No 2026 touchdown on file for {side}.</p> : null}
      {roster.length > 0 ? (
        <>
          <button type="button" onClick={() => setOpen((v) => !v)} className="card mt-3 flex w-full items-center gap-3 p-3 text-left">
            {active?.id ? <img src={headshot(active.id)} alt="" className="size-11 rounded-full object-cover object-top" /> : <span className="size-11 rounded-full bg-background" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{active ? active.name : "Choose a player"}</span>
              <span className="text-sm text-muted">{active ? `${active.team} · ${active.pos} · ${active.total} TD` : `${roster.length} players`}</span>
            </span>
            <span className="text-sm text-muted">{open ? "Close" : "Change"}</span>
          </button>
          {open ? (
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {roster.map((p) => (
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
          {active ? (
            <>
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
              weeks={active.weeks.map((w) => ({ label: playedOn(w.date, w.week), abbr: w.opp, value: w.td }))}
            />
          </div>
          {note ? <p className="mt-2 text-sm text-muted">{note.call}. {note.against}</p> : null}
          <ModelBox model={active.models?.td} />
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function LiveBoard({ away, home, pending = false }: { away: string; home: string; pending?: boolean }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [source, setSource] = useState("");
  const [market, setMarket] = useState<BoardMarket>("catches");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(true);
  const [line, setLine] = useState(0.5);
  const [win, setWin] = useState<"L5" | "L10" | "L15" | "2026" | "H2H">("L10");
  const [side, setSide] = useState(away);

  useEffect(() => {
    if (!away || !home) return;
    setSide(away);
    setName("");
    setOpen(true);
    setPlayers(null);
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => { setPlayers(d.players || []); setSource(d.source || ""); })
      .catch(() => setPlayers([]));
  }, [away, home]);

  const roster = [...(players || [])].filter((p) => p.team === side).sort((a, b) => a.name.localeCompare(b.name));
  const active = roster.find((p) => p.name === name) || null;
  const foe = active ? (active.team === away ? home : away) : home;
  const tabs = active ? BOARD.filter((item) => plays(active, item.key)) : BOARD;
  const view = tabs.some((item) => item.key === market) ? market : (tabs[0]?.key || "catches");
  const weeks = active ? takeWeeks(active.weeks, win, foe) : [];
  const values = weeks.map((week) => statOf(week, view));
  const shown = active ? read(values, line) : null;
  const windows = (["L5", "L10", "L15", "2026", "H2H"] as const).map((key) => {
    const rows = active ? takeWeeks(active.weeks, key, foe) : [];
    const nums = rows.map((week) => statOf(week, view));
    return { key, ...read(nums, line) };
  });

  function pickPlayer(player: Player) {
    const next = BOARD.find((item) => plays(player, item.key))?.key || "catches";
    const nums = player.weeks.map((week) => statOf(week, next));
    setName(player.name);
    setMarket(next);
    setOpen(false);
    setWin("L10");
    setLine(lineFor(nums));
  }

  function pickMarket(next: BoardMarket) {
    if (!active) return;
    setMarket(next);
    setLine(lineFor(active.weeks.map((week) => statOf(week, next))));
  }

  const deskRows: PropItem[] = roster.flatMap((player) => {
    if (!player.weeks.length) return [];
    const foeName = player.team === away ? home : away;
    const teamRec = roster.reduce((sum, mate) => sum + mate.weeks.reduce((s, week) => s + week.catches, 0), 0);
    const mine = player.weeks.reduce((sum, week) => sum + week.catches, 0);
    const share = teamRec > 0 ? Math.round((mine / teamRec) * 100) : null;
    const matchup = `${share == null ? "Reception share is not in this log." : `Reception share on the loaded 2026 log is ${share}%. That is receptions, not charted targets.`} Red-zone targets are not in this file. Coverage is the stadium chart on this page.`;
    return BOARD.filter((item) => item.key === "td" || plays(player, item.key)).map((item) => ({
      id: `${player.team}-${player.name}-${item.key}`,
      player: player.name,
      face: player.id ? headshot(player.id) : undefined,
      team: player.team,
      opp: foeName,
      market: item.label,
      games: player.weeks.map((week) => ({
        key: `${week.week}-${item.key}`,
        date: playedOn(week.date, week.week),
        opp: week.opp,
        value: statOf(week, item.key),
        box: `${playedOn(week.date, week.week)} vs ${week.opp}: ${statOf(week, item.key)} ${item.label}. Receptions ${week.catches}, receiving yards ${week.rec}, rush yards ${week.rush}, touchdowns ${week.td}. A full box score is not in this file.`,
      })),
      confirmed: false,
      season: [
        { label: "G", value: String(player.weeks.length) },
        { label: "Rec", value: String(mine) },
        { label: "TD", value: String(player.weeks.reduce((sum, week) => sum + week.td, 0)) },
      ],
      matchup,
      script: item.key === "rush" ? `Run script vs ${foeName}` : item.key === "td" ? `Score script vs ${foeName}` : `Pass script vs ${foeName}`,
    }));
  });

  return (
    <section className="flex w-full flex-col gap-3">
      <header>
        <p className="text-xs uppercase tracking-widest text-accent">Player props</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{away} @ {home}</h2>
        <p className="mt-1 text-sm text-muted">One side at a time. The list is ranked on the real log.</p>
      </header>
      <div className="flex gap-2">
        {[away, home].map((team) => (
          <button key={team} type="button" onClick={() => setSide(team)} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm ${side === team ? "bg-accent text-foreground" : "bg-card text-muted"}`}>
            <img src={mark(team)} alt="" className="size-5 object-contain" />
            {team}
          </button>
        ))}
      </div>
      <PropRank rows={deskRows} loading={!players} />
      <p className="text-xs text-muted">{source}</p>
    </section>
  );
}
