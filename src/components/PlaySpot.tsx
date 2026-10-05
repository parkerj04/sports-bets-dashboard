"use client";

import { useEffect, useMemo, useState } from "react";
import type { Edge } from "@/lib/mlb";
import { scoreTone } from "@/lib/score-color";
import { isPlayable } from "@/lib/edges";
import { SlipCheck } from "@/components/SlipTray";

type Hitter = { id: number; name: string; team: string; avg: string; hr: number; rbi: number };
type Log = { date: string; h: number; hr: number; r: number; rbi: number; sb: number };
type Spot = "game" | "batter";
type GameMarket = "ML" | "Total";
type BatMarket = "Hits" | "HR" | "H+R+RBI" | "SB";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function when(date: string) {
  const [, m, d] = date.split("-");
  return `${MONTHS[Number(m)] || m} ${Number(d)}`;
}
function one(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}
function lastName(name: string) {
  return name.split(" ").slice(-1)[0] || name;
}
function valueOf(row: Log, market: BatMarket) {
  if (market === "Hits") return row.h;
  if (market === "HR") return row.hr;
  if (market === "SB") return row.sb;
  return row.h + row.r + row.rbi;
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
  const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=hitting&season=2026`);
  if (!res.ok) return [];
  const data = await res.json();
  const rows: Log[] = [];
  for (const s of data?.stats?.[0]?.splits || []) {
    if (s.gameType === "S") continue;
    const st = s.stat || {};
    rows.push({
      date: s.date || "",
      h: st.hits || 0,
      hr: st.homeRuns || 0,
      r: st.runs || 0,
      rbi: st.rbi || 0,
      sb: st.stolenBases || 0,
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
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
  const player = roster.find((h) => h.id === playerId) || roster[0] || null;

  useEffect(() => {
    if (!player) return;
    if (logs[player.id]) return;
    let live = true;
    hittingLog(player.id)
      .then((rows) => { if (live) setLogs((cur) => ({ ...cur, [player.id]: rows })); })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [player, logs]);

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
              <button key={team} type="button" onClick={() => { setSide(team); setPlayerId(null); }} className={`min-h-11 truncate rounded-full px-3 text-sm ${side === team ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                {lastName(team)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roster.map((h) => (
              <button key={h.id} type="button" onClick={() => setPlayerId(h.id)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${player?.id === h.id ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                {lastName(h.name)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(["Hits", "HR", "H+R+RBI", "SB"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setBatMarket(key)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${batMarket === key ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
                {key === "SB" ? "Steals" : key === "HR" ? "Home runs" : key}
              </button>
            ))}
          </div>
          {!player ? <p className="text-sm text-muted">No hitters posted for {side}.</p> : null}
          {player && starts == null && !failed ? <p className="text-sm text-muted">Loading the 2026 log…</p> : null}
          {failed ? <p className="text-sm text-danger">The 2026 log did not load.</p> : null}
          {player && starts ? (
            <BatterCard player={player} market={batMarket} rows={shown} all={starts} line={line} hits={hits} win={win} setWin={setWin} note={batMarket === "SB" ? stealNote : undefined} />
          ) : null}
        </>
      )}
    </section>
  );
}

function BatterCard({
  player, market, rows, all, line, hits, win, setWin, note,
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
}) {
  const nums = rows.map((row) => valueOf(row, market));
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const call = !rows.length ? "Pass — no games" : rows.length < 3 ? "Pass — short log" : hits / rows.length >= 0.7 ? "Shape leans over" : hits / rows.length <= 0.35 ? "Shape leans under" : "No clear edge";
  const label = market === "HR" ? "Home runs" : market === "SB" ? "Steals" : market === "H+R+RBI" ? "Hits + runs + RBI" : "Hits";
  const scale = Math.max(line, ...nums, 1) * 1.25;
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="text-lg font-semibold">{player.name}</div>
      <p className="text-sm text-muted">{label} · {player.avg} AVG · {player.hr} HR · {player.rbi} RBI on the season</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
          <div className="font-mono text-3xl font-semibold">{one(line)}</div>
        </div>
        <div className="text-right text-sm text-muted">{rows.length ? `${hits}/${rows.length} over` : "No games"}</div>
      </div>
      <div className="mt-3 flex gap-2">
        {(["L5", "L10", "2026"] as const).map((key) => (
          <button key={key} type="button" onClick={() => setWin(key)} className={`min-h-11 rounded-xl px-3 text-sm ${win === key ? "bg-accent/30 ring-1 ring-accent" : "bg-card"}`}>
            {key}
          </button>
        ))}
      </div>
      <div className="mt-3 flex h-36 items-end overflow-x-auto">
        {rows.slice(-12).map((row) => {
          const n = valueOf(row, market);
          const height = Math.max((n / scale) * 100, n === 0 ? 4 : 10);
          const over = n > line;
          return (
            <div key={row.date} className="flex w-12 shrink-0 flex-col items-center justify-end h-full">
              <span className={`flex w-8 items-start justify-center rounded-md font-mono text-xs font-semibold text-background ${over ? "bg-good" : "bg-danger"}`} style={{ height: `${height}%` }}>{n}</span>
              <span className="mt-1 text-[10px] text-muted">{when(row.date).split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">{call}. Average {one(avg)} in this window. {market === "HR" || market === "SB" ? "The line is 0.5, one event. Not a sportsbook price." : "The line is the middle of the 2026 games. Not a sportsbook price."} {all.length > rows.length ? `Showing ${rows.length} of ${all.length}.` : ""}</p>
      {note ? <p className="mt-2 text-sm text-muted">{note.reasoning}</p> : null}
    </div>
  );
}
