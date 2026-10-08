"use client";

import { useEffect, useMemo, useState } from "react";
import type { Edge } from "@/lib/mlb";
import { scoreTone } from "@/lib/score-color";
import { mergeLogs, personLogUrls, readSplits } from "@/lib/mlb-log";
import { isPlayable } from "@/lib/edges";
import { SlipCheck } from "@/components/SlipTray";

type Hitter = { id: number; name: string; team: string; avg: string; hr: number; rbi: number };
type Log = { date: string; opp: string; h: number; hr: number; r: number; rbi: number; sb: number };
type Spot = "game" | "batter";
type GameMarket = "ML" | "Total";
type BatMarket = "Hits" | "HR" | "H+R+RBI" | "SB";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function mlbLogo(name: string) {
  const code = name.toLowerCase();
  const map: [string, string][] = [
    ["diamondbacks", "ari"], ["braves", "atl"], ["orioles", "bal"], ["red sox", "bos"], ["white sox", "chw"],
    ["cubs", "chc"], ["reds", "cin"], ["guardians", "cle"], ["rockies", "col"], ["tigers", "det"],
    ["astros", "hou"], ["royals", "kc"], ["angels", "laa"], ["dodgers", "lad"], ["marlins", "mia"],
    ["brewers", "mil"], ["twins", "min"], ["mets", "nym"], ["yankees", "nyy"], ["athletics", "oak"],
    ["phillies", "phi"], ["pirates", "pit"], ["padres", "sd"], ["giants", "sf"], ["mariners", "sea"],
    ["cardinals", "stl"], ["rays", "tb"], ["rangers", "tex"], ["blue jays", "tor"], ["nationals", "wsh"],
  ];
  const hit = map.find(([k]) => code.includes(k));
  return `https://a.espncdn.com/i/teamlogos/mlb/500/${hit ? hit[1] : "mlb"}.png`;
}
function when(date: string) {
  const [, m, d] = date.split("-");
  return `${MONTHS[Number(m)] || m} ${Number(d)}`;
}
function one(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}
function cleanName(name: string) {
  return name.replace(/^\d+\.\s*/, "").replace(/,/g, "").trim();
}
function lastName(name: string) {
  const parts = cleanName(name).split(/\s+/).filter(Boolean);
  while (parts.length > 1 && /^(jr\.?|sr\.?|ii|iii|iv|v)$/i.test(parts[parts.length - 1])) parts.pop();
  return parts[parts.length - 1] || name;
}
function valueOf(row: Log, market: BatMarket) {
  if (market === "Hits") return row.h;
  if (market === "HR") return row.hr;
  if (market === "SB") return row.sb;
  return row.h + row.r + row.rbi;
}
function face(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_180,q_auto:best/v1/people/${id}/headshot/67/current`;
}

function project(rows: Log[] | undefined, market: BatMarket) {
  if (!rows?.length) return null;
  const total = rows.reduce((sum, row) => sum + valueOf(row, market), 0);
  return total / rows.length;
}

function Face({ id, name, className }: { id: number; name: string; className: string }) {
  const [bad, setBad] = useState(false);
  if (bad) {
    return <span className={`grid place-items-center rounded-full bg-card text-[10px] font-semibold ${className}`}>{lastName(name).slice(0, 1)}</span>;
  }
  return <img src={face(id)} alt="" className={`rounded-full object-cover object-top ${className}`} onError={() => setBad(true)} />;
}

function researchLine(values: number[], market: BatMarket) {
  if (market === "HR" || market === "SB") return 0.5;
  if (!values.length) return 0.5;
  const s = [...values].sort((a, b) => a - b);
  const mid = (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2;
  const snapped = Math.round(mid * 2) / 2;
  return snapped > 0 ? snapped : 0.5;
}

async function hittingLog(id: number): Promise<Log[]> {
  const payloads = await Promise.all(
    personLogUrls(id, "hitting").map((url) => fetch(url, { cache: "no-store" }).then((res) => (res.ok ? res.json() : null)).catch(() => null))
  );
  const rows: Log[] = [];
  for (const s of mergeLogs(payloads.map(readSplits))) {
    const st = s.stat || {};
    rows.push({
      date: s.date || "",
      opp: s.opponent?.name || "",
      h: Number(st.hits) || 0,
      hr: Number(st.homeRuns) || 0,
      r: Number(st.runs) || 0,
      rbi: Number(st.rbi) || 0,
      sb: Number(st.stolenBases) || 0,
    });
  }
  return rows;
}

export function PlaySpot({
  away,
  home,
  hitters,
  notes,
}: {
  away: string;
  home: string;
  hitters: Hitter[];
  notes: Edge[];
}) {
  const [spot, setSpot] = useState<Spot>("game");
  const [gameMarket, setGameMarket] = useState<GameMarket>("ML");
  const [side, setSide] = useState(away);
  const [batMarket, setBatMarket] = useState<BatMarket>("Hits");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [logs, setLogs] = useState<Record<number, Log[]>>({});
  const [failed, setFailed] = useState(false);
  const [win, setWin] = useState<"L5" | "L10" | "2026">("L10");

  const roster = hitters.filter((h) => h.team === side);
  const rosterKey = roster.map((h) => h.id).join(",");
  const player = roster.find((h) => h.id === playerId) || roster[0] || null;

  useEffect(() => {
    const ids = rosterKey ? rosterKey.split(",").map(Number) : [];
    let live = true;
    for (const id of ids) {
      hittingLog(id)
        .then((rows) => { if (live) setLogs((cur) => (cur[id] ? cur : { ...cur, [id]: rows })); })
        .catch(() => { if (live) setFailed(true); });
    }
    return () => { live = false; };
  }, [rosterKey]);

  const starts = player ? logs[player.id] : undefined;
  const values = useMemo(() => (starts || []).map((row) => valueOf(row, batMarket)), [starts, batMarket]);
  const line = researchLine(values, batMarket);
  const shown = win === "L5" ? (starts || []).slice(-5) : win === "L10" ? (starts || []).slice(-10) : starts || [];
  const hits = shown.filter((row) => valueOf(row, batMarket) > line).length;
  const gameNotes = notes.filter((n) => (gameMarket === "ML" ? n.market === "Moneyline" : n.market === "Game Total" || n.market === "Total"));
  const stealNote = player ? notes.find((n) => n.market === "Stolen Bases" && n.pick.includes(lastName(player.name))) : undefined;

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-2">
        {(["game", "batter"] as const).map((key) => (
          <button key={key} type="button" onClick={() => setSpot(key)} className={`min-h-11 rounded-full text-sm font-medium ${spot === key ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
            {key === "game" ? "Game" : "Batter"}
          </button>
        ))}
      </div>

      {spot === "game" ? (
        <>
          <div className="flex gap-2">
            {(["ML", "Total"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setGameMarket(key)} className={`min-h-11 rounded-full px-4 text-sm ${gameMarket === key ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                {key === "ML" ? "Moneyline" : "Over / under"}
              </button>
            ))}
          </div>
          {gameNotes.length === 0 ? (
            <p className="text-sm text-muted">No {gameMarket === "ML" ? "moneyline" : "total"} card on this game.</p>
          ) : gameNotes.slice(0, 2).map((n) => (
            <div key={n.pick} className="rounded-xl bg-background p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{n.pick}</div>
                <div className={`font-mono text-2xl font-semibold ${scoreTone(n.edgeScore)}`}>{n.edgeScore}</div>
              </div>
              <p className="mt-2 text-sm text-muted">{n.reasoning}</p>
              <div className="mt-2">
                <SlipCheck item={{ id: `${n.gamePk}-${n.market}-${n.pick}`, sport: "MLB", game: n.game, market: n.market, pick: n.pick, score: n.edgeScore, why: n.reasoning, playable: isPlayable(n) }} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="flex gap-2">
            {[away, home].map((team) => (
              <button key={team} type="button" onClick={() => { setSide(team); setPlayerId(null); }} className={`flex min-h-11 items-center gap-2 truncate rounded-full px-3 text-sm ${side === team ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                <img src={mlbLogo(team)} alt="" className="size-5 object-contain" />
                {lastName(team)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roster.map((h) => {
              const proj = project(logs[h.id], batMarket);
              return (
                <button key={h.id} type="button" onClick={() => setPlayerId(h.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm ${player?.id === h.id ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                  <Face id={h.id} name={h.name} className="size-8" />
                  <span>{lastName(h.name)}</span>
                  <span className="font-mono text-xs">{proj == null ? "—" : one(proj)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(["Hits", "HR", "H+R+RBI", "SB"] as const).map((key) => {
              const proj = player ? project(logs[player.id], key) : null;
              const label = key === "SB" ? "Steals" : key === "HR" ? "Home runs" : key;
              return (
                <button key={key} type="button" onClick={() => setBatMarket(key)} className={`flex min-h-14 shrink-0 flex-col items-center justify-center rounded-2xl px-3 text-sm ${batMarket === key ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                  <span>{label}</span>
                  <span className="font-mono text-xs font-semibold">{proj == null ? "—" : one(proj)}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">Each number is that stat per game in 2026. Not a sportsbook price.</p>
          {!player ? <p className="text-sm text-muted">No hitters posted for {side}.</p> : null}
          {player && starts == null && !failed ? <p className="text-sm text-muted">Loading the 2026 log…</p> : null}
          {failed ? <p className="text-sm text-danger">The 2026 log did not load.</p> : null}
          {player && starts ? (
            <BatterCard player={player} market={batMarket} rows={shown} all={starts} line={line} hits={hits} win={win} setWin={setWin} note={batMarket === "SB" ? stealNote : undefined} foe={side === away ? home : away} />
          ) : null}
        </>
      )}
    </section>
  );
}

function BatterCard({
  player, market, rows, all, line, hits, win, setWin, note, foe,
}: {
  player: Hitter;
  market: BatMarket;
  rows: Log[];
  all: Log[];
  line: number;
  hits: number;
  win: "L5" | "L10" | "2026";
  setWin: (w: "L5" | "L10" | "2026") => void;
  note?: Edge;
  foe: string;
}) {
  const nums = rows.map((row) => valueOf(row, market));
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const call = !rows.length ? "Pass — no games" : rows.length < 3 ? "Pass — short log" : hits / rows.length >= 0.7 ? "Shape leans over" : hits / rows.length <= 0.35 ? "Shape leans under" : "No clear edge";
  const label = market === "HR" ? "Home runs" : market === "SB" ? "Steals" : market === "H+R+RBI" ? "Hits + runs + RBI" : "Hits";
  const unit = market === "HR" ? "home runs" : market === "SB" ? "steals" : market === "H+R+RBI" ? "hits + runs + RBI" : "hits";
  const season = all.length ? all.reduce((sum, row) => sum + valueOf(row, market), 0) / all.length : 0;
  const recent = all.slice(-5);
  const hot = recent.length ? recent.reduce((sum, row) => sum + valueOf(row, market), 0) / recent.length : season;
  const projected = season;
  const vs = all.filter((row) => {
    const opp = row.opp.toLowerCase();
    const other = foe.toLowerCase();
    return opp && (other.includes(opp) || opp.includes(other.split(" ").pop() || other));
  });
  const vsAvg = vs.length ? vs.reduce((sum, row) => sum + valueOf(row, market), 0) / vs.length : null;
  const model = `${cleanName(player.name)} projects to ${one(projected)} ${unit}. That is the 2026 average over ${all.length} games. The last ${recent.length} average ${one(hot)} and are not mixed in. ${vsAvg == null ? `There is no 2026 game against ${foe} on the log, so the opponent is not in the number.` : `Against ${foe} in 2026: ${one(vsAvg)} over ${vs.length} game${vs.length === 1 ? "" : "s"}. That sample is shown, not averaged in.`} No park factor and no opposing pitcher is in this number. Not a book price.`;
  const scale = Math.max(line, ...nums, 1) * 1.25;
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="flex items-center gap-3">
        <Face id={player.id} name={player.name} className="size-12" />
        <div>
          <div className="text-lg font-semibold">{cleanName(player.name)}</div>
          <p className="text-sm text-muted">{label} · {player.avg} AVG · {player.hr} HR · {player.rbi} RBI on the season</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
          <div className="font-mono text-3xl font-semibold">{one(line)}</div>
        </div>
        <div className="text-right text-sm text-muted">{rows.length ? `${hits}/${rows.length} over` : "No games"}</div>
      </div>
      <div className="mt-3 flex gap-2">
        {(["L5", "L10", "2026"] as const).map((key) => (
          <button key={key} type="button" onClick={() => setWin(key)} className={`flex size-16 shrink-0 items-center justify-center rounded-3xl text-sm ${win === key ? "bg-accent/30 ring-1 ring-accent" : "bg-card"}`}>
            {key}
          </button>
        ))}
      </div>
      <div className="mt-3 flex h-44 items-end overflow-x-auto">
        {rows.slice(-12).map((row) => {
          const n = valueOf(row, market);
          const height = Math.max((n / scale) * 100, n === 0 ? 4 : 10);
          const over = n > line;
          return (
            <div key={row.date} className="flex h-full w-14 shrink-0 flex-col items-center justify-end">
              <span className={`flex w-8 items-start justify-center rounded-md font-mono text-xs font-semibold text-background ${over ? "bg-good" : "bg-danger"}`} style={{ height: `${height}%` }}>{n}</span>
              {row.opp ? (
                <span className="mt-2 grid size-8 place-items-center rounded-full bg-card ring-1 ring-accent/40">
                  <img src={mlbLogo(row.opp)} alt="" className="size-5 object-contain" />
                </span>
              ) : null}
              <span className="mt-1 font-mono text-[10px] leading-none text-muted">{when(row.date)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">{call}. Average {one(avg)} in this window. {market === "HR" || market === "SB" ? "The line is 0.5, one event. Not a sportsbook price." : "The line is the middle of the 2026 games. Not a sportsbook price."} {all.length > rows.length ? `Showing ${rows.length} of ${all.length}.` : ""}</p>
      <div className="mt-4 rounded-xl bg-card p-3">
        <div className="text-xs uppercase tracking-widest text-accent">Protected model</div>
        <div className="font-mono text-3xl font-semibold">{one(projected)}</div>
        <p className="mt-1 text-sm text-muted">{model}</p>
      </div>
      {note ? <p className="mt-2 text-sm text-muted">{note.reasoning}</p> : null}
    </div>
  );
}
