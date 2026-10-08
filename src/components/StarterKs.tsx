"use client";

import { useEffect, useMemo, useState } from "react";
import type { Crew } from "@/lib/facts";
import { mergeLogs, personLogUrls, readSplits } from "@/lib/mlb-log";

type Start = { date: string; opp: string; k: number; ip: string };
type Arm = {
  id: number;
  name: string;
  hand: string;
  team: string;
  foe: string;
  wins: number;
  losses: number;
  gs: number;
  ip: number;
  k9: number;
  era: number;
  so: number;
};
type Win = "L5" | "L10" | "L15" | "2026" | "H2H";
type Line = { spread: string; total: string; ml: string };

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ABBR: Record<string, string> = {
  "Arizona Diamondbacks": "ARI", "Atlanta Braves": "ATL", "Baltimore Orioles": "BAL", "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC", "Chicago White Sox": "CWS", "Cincinnati Reds": "CIN", "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL", "Detroit Tigers": "DET", "Houston Astros": "HOU", "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA", "Los Angeles Dodgers": "LAD", "Miami Marlins": "MIA", "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN", "New York Mets": "NYM", "New York Yankees": "NYY", "Athletics": "ATH", "Oakland Athletics": "ATH",
  "Philadelphia Phillies": "PHI", "Pittsburgh Pirates": "PIT", "San Diego Padres": "SD", "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA", "St. Louis Cardinals": "STL", "Tampa Bay Rays": "TB", "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR", "Washington Nationals": "WSH",
};

function abbr(name: string) {
  return ABBR[name] || name.split(" ").pop()?.slice(0, 3).toUpperCase() || name;
}
function mlbLogo(abbrCode: string) {
  const fix: Record<string, string> = { ATH: "oak", CWS: "chw", CHW: "chw" };
  return `https://a.espncdn.com/i/teamlogos/mlb/500/${(fix[abbrCode] || abbrCode).toLowerCase()}.png`;
}
function when(date: string) {
  const [, m, d] = date.split("-");
  return `${MONTHS[Number(m)] || m} ${Number(d)}`;
}
function one(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function innings(ip: string) {
  const [whole, frac] = String(ip || "0").split(".");
  const outs = frac === "1" ? 1 / 3 : frac === "2" ? 2 / 3 : 0;
  return (Number(whole) || 0) + outs;
}

function KModel({ arm, starts }: { arm: Arm; starts: Start[] }) {
  if (!starts.length) return null;
  const rate = starts.reduce((sum, row) => sum + row.k, 0) / starts.length;
  const ip = starts.reduce((sum, row) => sum + innings(row.ip), 0) / starts.length;
  const fromK9 = arm.k9 > 0 && ip > 0 ? (arm.k9 * ip) / 9 : rate;
  const last = starts.slice(-5);
  const recent = last.reduce((sum, row) => sum + row.k, 0) / last.length;
  const value = Math.round(rate * 10) / 10;
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="text-xs uppercase tracking-widest text-accent">Protected model</div>
      <div className="font-mono text-3xl font-semibold">{value.toFixed(1)}</div>
      <p className="mt-1 text-sm text-muted">
        {arm.name} projects to {value.toFixed(1)} strikeouts. That is the average of {starts.length} starts in 2026. The last {last.length} average {one(recent)} and are not mixed in. Season {one(arm.k9)} K/9 over a typical {one(ip)} innings would be {one(fromK9)}, and that check is not added either. Not a book price.
      </p>
    </div>
  );
}
function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}
function summarize(values: number[], line: number) {
  const n = values.length;
  const hits = values.filter((v) => v > line).length;
  const avg = n ? values.reduce((a, b) => a + b, 0) / n : 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = n ? (sorted[Math.floor((n - 1) / 2)] + sorted[Math.ceil((n - 1) / 2)]) / 2 : 0;
  return { n, hits, avg, mid, pct: n ? hits / n : 0 };
}
function researchLine(values: number[]) {
  const { mid } = summarize(values, 0);
  return Math.round(mid * 2) / 2;
}

async function seasonLog(id: number): Promise<Start[]> {
  const payloads = await Promise.all(
    personLogUrls(id, "pitching").map((url) => fetch(url, { cache: "no-store" }).then((res) => (res.ok ? res.json() : null)).catch(() => null))
  );
  const rows: Start[] = [];
  for (const s of mergeLogs(payloads.map(readSplits))) {
    const st = s.stat || {};
    if (!st.gamesStarted) continue;
    rows.push({
      date: s.date || "",
      opp: s.opponent?.name || "",
      k: Number(st.strikeOuts) || 0,
      ip: String(st.inningsPitched || ""),
    });
  }
  return rows;
}

export function StarterKs({
  away,
  home,
  venue,
  status,
  open,
  situation,
  crew,
}: {
  away: Arm | null;
  home: Arm | null;
  venue?: string;
  status?: string;
  open?: string | null;
  situation?: string | null;
  crew?: Crew | null;
}) {
  const arms = [away, home].filter((a): a is Arm => !!a?.id);
  const [side, setSide] = useState(0);
  const [logs, setLogs] = useState<Record<number, Start[]>>({});
  const [failed, setFailed] = useState(false);
  const [lineBox, setLineBox] = useState<Line | null>(null);
  const arm = arms[side] || arms[0];
  const starts = arm ? logs[arm.id] || [] : [];
  const base = useMemo(() => researchLine(starts.map((s) => s.k)), [starts]);
  const [line, setLine] = useState(base);
  const [win, setWin] = useState<Win>("L10");
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setLine(base);
    setWin("L10");
    setPicked(null);
  }, [arm?.id, base]);

  useEffect(() => {
    let live = true;
    Promise.all(arms.map(async (a) => [a.id, await seasonLog(a.id)] as const))
      .then((rows) => {
        if (!live) return;
        const next: Record<number, Start[]> = {};
        for (const [id, log] of rows) next[id] = log;
        setLogs(next);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [away?.id, home?.id]);

  useEffect(() => {
    if (!away || !home) return;
    fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard")
      .then((r) => r.json())
      .then((data) => {
        for (const e of data.events || []) {
          const comp = e.competitions?.[0];
          const names = (comp?.competitors || []).map((c: { team?: { displayName?: string } }) => (c.team?.displayName || "").toLowerCase());
          if (!names.includes(away.team.toLowerCase()) || !names.includes(home.team.toLowerCase())) continue;
          const odds = comp?.odds?.[0];
          if (!odds) return;
          const mlA = odds.moneyline?.away?.close?.odds || "";
          const mlH = odds.moneyline?.home?.close?.odds || "";
          setLineBox({
            spread: odds.details || "",
            total: odds.overUnder != null ? String(odds.overUnder) : "",
            ml: [mlA, mlH].filter(Boolean).join("/"),
          });
        }
      })
      .catch(() => setLineBox(null));
  }, [away?.team, home?.team]);

  if (!arm) return null;
  const vs = starts.filter((s) => s.opp === arm.foe);
  const windows: { key: Win; label: string; rows: Start[] }[] = [
    { key: "L5", label: "L5", rows: starts.slice(-5) },
    { key: "L10", label: "L10", rows: starts.slice(-10) },
    { key: "L15", label: "L15", rows: starts.slice(-15) },
    { key: "2026", label: "2026", rows: starts },
    { key: "H2H", label: `vs ${abbr(arm.foe)}`, rows: vs },
  ];
  const shown = windows.find((w) => w.key === win)?.rows || [];
  const chart = shown.slice(-12);
  const stat = summarize(shown.map((s) => s.k), line);
  const title = win === "L5" ? "Last 5 starts" : win === "L10" ? "Last 10 starts" : win === "L15" ? "Last 15 starts" : win === "2026" ? "2026 starts" : `Starts vs ${arm.foe}`;
  const call = !shown.length ? "Pass — no starts" : shown.length < 3 ? "Pass — short log" : stat.pct >= 0.7 && stat.mid > line ? "Shape leans over" : stat.pct <= 0.35 && stat.mid < line ? "Shape leans under" : "No clear edge";
  const why = !shown.length
    ? `No 2026 start against ${arm.foe} is in the log.`
    : `${stat.hits} of ${stat.n} cleared ${one(line)}. Average ${one(stat.avg)}, median ${one(stat.mid)}.`;
  const loading = arms.some((a) => logs[a.id] == null) && !failed;

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Starter strikeouts</h2>
          <p className="mt-1 text-sm text-muted">{status}{venue ? ` · ${venue}` : ""}</p>
        </div>
      </div>
      {lineBox && (lineBox.spread || lineBox.total || lineBox.ml) ? (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-background py-2"><div className="text-muted">Run line</div><div className="font-mono">{lineBox.spread || "—"}</div></div>
          <div className="rounded-xl bg-background py-2"><div className="text-muted">Total</div><div className="font-mono">{lineBox.total || "—"}</div></div>
          <div className="rounded-xl bg-background py-2"><div className="text-muted">ML</div><div className="font-mono">{lineBox.ml || "—"}</div></div>
        </div>
      ) : null}
      {open ? <p className="text-sm text-muted">{open}</p> : null}
      <div className="flex gap-2 overflow-x-auto">
        {arms.map((a, i) => (
          <button key={a.id} type="button" onClick={() => setSide(i)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${arm.id === a.id ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
            {abbr(a.team)} · {a.name.split(" ").slice(-1)}
          </button>
        ))}
      </div>
      <div>
        <div className="text-lg font-semibold">{arm.name}</div>
        <p className="text-sm text-muted">{arm.hand}HP · {arm.wins}-{arm.losses} · {arm.gs} GS · {arm.so} K · {one(arm.k9)} K/9 · {one(arm.era)} ERA</p>
      </div>
      {loading ? <p className="text-sm text-muted">Loading the 2026 strikeout log…</p> : null}
      {failed ? <p className="text-sm text-danger">The 2026 strikeout log did not load.</p> : null}
      {!loading && !failed && (
        <>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
              <div className="font-mono text-3xl font-semibold">{one(line)}</div>
            </div>
            <div className="text-right text-sm text-muted">{stat.n ? `${stat.hits}/${stat.n} over · ${pct(stat.pct)}` : "No starts"}</div>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {windows.map((w) => {
              const s = summarize(w.rows.map((r) => r.k), line);
              return (
                <button key={w.key} type="button" onClick={() => { setWin(w.key); setPicked(null); }} className={`flex size-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-3xl px-1 text-center leading-none ${win === w.key ? "bg-accent/30 ring-1 ring-accent" : "bg-background"}`}>
                  <div className="text-xs text-muted">{w.label}</div>
                  <div className={`font-mono text-sm font-semibold ${s.n && s.pct >= 0.5 ? "text-good" : "text-danger"}`}>{s.n ? pct(s.pct) : "—"}</div>
                  <div className="font-mono text-xs text-muted">{s.n ? `Avg ${one(s.avg)}` : "No starts"}</div>
                </button>
              );
            })}
          </div>
          <KChart rows={chart} line={line} picked={picked} onPick={setPicked} />
          <div className="rounded-xl bg-background p-3">
            <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
            {chart.length === 0 ? <p className="mt-2 text-sm text-muted">No starts in this window.</p> : (
              <ul className="mt-2 max-h-52 overflow-y-auto">
                {[...chart].reverse().map((row, i) => {
                  const idx = chart.length - 1 - i;
                  const over = row.k > line;
                  return (
                    <li key={`${row.date}-${row.opp}`}>
                      <button type="button" onClick={() => setPicked(idx)} className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-card-border py-2 text-left first:border-t-0">
                        <span className="text-sm">{when(row.date)} vs {abbr(row.opp)} · {row.ip} IP</span>
                        <span className={`font-mono text-sm ${over ? "text-good" : "text-danger"}`}>{row.k} {over ? "over" : "under"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {shown.length > chart.length ? <p className="mt-2 text-xs text-muted">Showing the last {chart.length} of {shown.length} starts.</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Lower the line" onClick={() => setLine((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}>−</button>
            <input className="h-11 min-w-0 flex-1 accent-accent" type="range" min={0} max={Math.max(12, Math.ceil(Math.max(line, ...chart.map((r) => r.k), 1)))} step={0.5} value={line} aria-label="Research line" onChange={(e) => setLine(Number(e.target.value))} />
            <button type="button" className="size-11 shrink-0 rounded-full bg-background text-lg" aria-label="Raise the line" onClick={() => setLine((v) => Math.round((v + 0.5) * 10) / 10)}>+</button>
          </div>
          <p className="text-xs text-muted">Set at the middle of the 2026 starts. Move it and the colors follow. Not a sportsbook price.</p>
          <KModel arm={arm} starts={starts} />
          <div>
            <p className="text-xs uppercase tracking-widest text-accent">Desk call</p>
            <h3 className="mt-1 text-2xl font-semibold">{call}</h3>
            <p className="mt-2 text-sm text-muted">{why} Season line is {arm.so} strikeouts in {arm.ip} innings.</p>
            {situation ? <p className="mt-2 text-sm">{situation}</p> : null}
            <CrewNote crew={crew} team={arm.team} starter={arm.name} />
          </div>
        </>
      )}
    </section>
  );
}

function CrewNote({ crew, team, starter }: { crew?: Crew | null; team: string; starter: string }) {
  if (!crew || (!crew.umpire && crew.pens.length === 0)) return null;
  const pen = crew.pens.find((p) => p.team === team) || crew.pens.find((p) => team.includes(p.team) || p.team.includes(team));
  const ump = crew.umpire;
  return (
    <div className="mt-3 space-y-2 text-sm text-muted">
      {ump ? (
        <p>
          Home plate {ump.name}.
          {ump.k9 != null ? ` ${one(ump.k9)} K/9 in his last ${ump.games} games, ${ump.k} K in ${ump.ip} innings.` : " Not enough final games in the sample for a K rate."}
        </p>
      ) : null}
      {pen && pen.arms.length > 0 ? (
        <p>Most used behind {starter}, not a promise of the seventh: {pen.arms.map((a) => `${a.name} ${a.g} G, ${one(a.k9)} K/9`).join(" · ")}.</p>
      ) : null}
    </div>
  );
}

function KChart({ rows, line, picked, onPick }: { rows: Start[]; line: number; picked: number | null; onPick: (i: number) => void }) {
  const nums = rows.map((r) => r.k);
  const scale = Math.max(line, ...nums, 1) * 1.15;
  const linePct = (line / scale) * 100;
  return (
    <div className="overflow-x-auto pb-1">
      <div className="relative" style={{ width: Math.max(rows.length * 58, 280) }}>
        <div className="relative h-44">
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-foreground" style={{ bottom: `${linePct}%` }}>
            <span className="absolute -top-3 right-0 rounded-full bg-foreground px-2 py-0.5 font-mono text-xs font-semibold text-background">{one(line)}</span>
          </div>
          <div className="flex h-full items-end">
            {rows.map((row, i) => {
              const height = Math.max((row.k / scale) * 100, row.k === 0 ? 3 : 8);
              const over = row.k > line;
              return (
                <button key={`${row.date}-${i}`} type="button" onClick={() => onPick(i)} className="relative h-full w-14 shrink-0" aria-pressed={picked === i}>
                  <span className={`absolute inset-x-1.5 bottom-0 rounded-md ${over ? "bg-good" : "bg-danger"} ${picked === i ? "ring-2 ring-accent" : ""}`} style={{ height: `${height}%` }}>
                    <span className="block pt-1 text-center font-mono text-xs font-semibold text-background">{row.k}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex">
          {rows.map((row, i) => (
            <div key={`${row.date}-l-${i}`} className="flex w-14 shrink-0 flex-col items-center">
              <span className={`grid size-8 place-items-center rounded-full bg-background ring-1 ${picked === i ? "ring-accent" : "ring-card-border"}`}>
                <img src={mlbLogo(abbr(row.opp))} alt="" className="size-5 object-contain" />
              </span>
              <span className="mt-1 text-center font-mono text-[10px] leading-none text-muted">{when(row.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
