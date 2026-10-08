"use client";

import { useEffect, useMemo, useState } from "react";
import type { Edge } from "@/lib/mlb";
import type { BvP } from "@/lib/propdesk";
import { scoreTone } from "@/lib/score-color";
import { mergeLogs, personLogUrls, readSplits } from "@/lib/mlb-log";
import { isPlayable } from "@/lib/edges";
import { SlipCheck } from "@/components/SlipTray";

type Hitter = { id: number; name: string; team: string; avg: string; hr: number; rbi: number };
type Log = { date: string; opp: string; h: number; hr: number; r: number; rbi: number; sb: number };
type Arm = { id: number; name: string; hand: string; team: string; hr9: number; whip: number; era: number; k9: number; avgAgainst: number; ip: number; sb: number; cs: number };
type Club = { name: string; kPct: number; avg: string; ops: string };
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

function sameClub(opp: string, foe: string) {
  const a = opp.toLowerCase();
  const b = foe.toLowerCase();
  const last = b.split(" ").pop() || b;
  return Boolean(a) && (b.includes(a) || a.includes(last));
}

function sliceLog(rows: Log[], win: "L5" | "L10" | "L15" | "2026" | "H2H", foe: string) {
  if (win === "H2H") return rows.filter((row) => sameClub(row.opp, foe));
  if (win === "2026") return rows;
  const n = win === "L5" ? 5 : win === "L10" ? 10 : 15;
  return rows.slice(-n);
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
  awayArm,
  homeArm,
  bvp,
  awayClub,
  homeClub,
}: {
  away: string;
  home: string;
  hitters: Hitter[];
  notes: Edge[];
  awayArm: Arm | null;
  homeArm: Arm | null;
  bvp: BvP[];
  awayClub: Club | null;
  homeClub: Club | null;
}) {
  const [spot, setSpot] = useState<Spot>("game");
  const [gameMarket, setGameMarket] = useState<GameMarket>("ML");
  const [side, setSide] = useState(away);
  const [batMarket, setBatMarket] = useState<BatMarket>("Hits");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [logs, setLogs] = useState<Record<number, Log[]>>({});
  const [failed, setFailed] = useState(false);
  const [win, setWin] = useState<"L5" | "L10" | "L15" | "2026" | "H2H">("L10");
  const [line, setLine] = useState(0.5);

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
  const seed = researchLine(values, batMarket);
  useEffect(() => { setLine(seed); }, [player?.id, batMarket, seed]);
  const foeName = side === away ? home : away;
  const shown = sliceLog(starts || [], win, foeName);
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
          {!player ? <p className="text-sm text-muted">No hitters posted for {side}.</p> : null}
          {player && starts == null && !failed ? <p className="text-sm text-muted">Loading the 2026 log…</p> : null}
          {failed ? <p className="text-sm text-danger">The 2026 log did not load.</p> : null}
          {player && starts ? (
            <BatterCard player={player} market={batMarket} setMarket={setBatMarket} rows={shown} all={starts} line={line} setLine={setLine} hits={hits} win={win} setWin={setWin} note={batMarket === "SB" ? stealNote : undefined} foe={foeName} arm={side === away ? homeArm : awayArm} club={side === away ? homeClub : awayClub} prior={bvp.find((row) => row.batterId === player.id) || null} />
          ) : null}
        </>
      )}
    </section>
  );
}

function batterRead(input: {
  name: string;
  market: BatMarket;
  unit: string;
  rate: number;
  n: number;
  recent: number;
  recentN: number;
  foe: string;
  vsAvg: number | null;
  vsN: number;
  arm: Arm | null;
  club: Club | null;
  prior: BvP | null;
}) {
  const { name, market, unit, rate, n, recent, recentN, foe, vsAvg, vsN, arm, club, prior } = input;
  const teamLine = vsAvg == null
    ? `No 2026 game against ${foe} is on his log.`
    : `Against ${foe} in 2026 he averaged ${one(vsAvg)} ${unit} over ${vsN} game${vsN === 1 ? "" : "s"}. That sample is not averaged into the rate.`;
  const clubLine = club
    ? `${foe} as a team are hitting ${club.avg} with a ${club.ops} OPS and a ${one(club.kPct)}% strikeout rate.`
    : `${foe} team hitting line is not on this card.`;
  const history = !prior || prior.ab < 5
    ? `Career at-bats against today's starter are under 5, so that history is not used.`
    : `Career against today's starter: ${prior.h}-for-${prior.ab}, ${prior.hr} HR, ${prior.so} K.`;
  const base = `${name} is at ${one(rate)} ${unit} per game over ${n} games in 2026. The last ${recentN} average ${one(recent)} and are not mixed in.`;
  if (!arm) {
    return {
      call: "Starter not posted",
      text: `${base} No probable pitcher is on the card, so there is no starter matchup. ${teamLine} ${clubLine} Not a book price.`,
    };
  }
  const who = `${arm.name} (${arm.hand}HP)`;
  if (market === "HR") {
    const leak = arm.hr9 >= 1.3;
    return {
      call: leak ? "Starter is giving up homers" : "Won't lean a homer",
      text: `${leak ? "The case for one is the starter." : "The case against one is the starter."} ${who} allows ${one(arm.hr9)} HR/9, with a ${one(arm.k9)} K/9 and a ${one(arm.era)} ERA. The desk treats 1.3 HR/9 as a fly-ball leak. ${who} is ${leak ? "at or over" : "under"} that cut. ${base} ${history} ${teamLine} Not a book price.`,
    };
  }
  if (market === "Hits") {
    const soft = arm.avgAgainst >= 0.23 || arm.whip >= 1.28;
    const tough = arm.avgAgainst > 0 && arm.avgAgainst <= 0.21 && arm.whip < 1.28;
    return {
      call: soft ? "Starter is allowing contact" : tough ? "Won't lean a hit" : "No clear hit lean",
      text: `${who} has a ${arm.avgAgainst.toFixed(3)} average against and a ${one(arm.whip)} WHIP. The desk flags contact at a .230 average against or a 1.28 WHIP, and a tough line at .210 or lower with a WHIP under 1.28. ${base} ${history} ${teamLine} Not a book price.`,
    };
  }
  if (market === "SB") {
    const held = arm.ip >= 30 && arm.sb + arm.cs === 0;
    const loose = arm.sb >= 8;
    return {
      call: held ? "Won't lean a steal" : loose ? "Starter has been run on" : "No clear steal lean",
      text: `${who} has allowed ${arm.sb} steals and ${arm.cs} caught stealing in ${one(arm.ip)} innings. ${held ? "No steal attempt in at least 30 innings is the case against." : loose ? "Eight or more steals allowed is the case for a runner who is on." : "That hold rate is on the card and does not clear either cut."} ${base} ${clubLine} Not a book price.`,
    };
  }
  const soft = arm.era >= 4.2 || arm.whip >= 1.28;
  const stingy = arm.era > 0 && arm.era <= 3.2 && arm.whip < 1.28;
  return {
    call: soft ? "Starter is a runs spot" : stingy ? "Won't lean a big counting line" : "No clear counting lean",
    text: `Hits, runs, and RBI run through the starter and the other lineup. ${who} has a ${one(arm.era)} ERA and a ${one(arm.whip)} WHIP. The desk treats 4.20 ERA or a 1.28 WHIP as a runs spot, and 3.20 ERA with a lower WHIP as a quiet one. ${base} ${clubLine} ${teamLine} Not a book price.`,
  };
}

function BatterCard({
  player, market, setMarket, rows, all, line, setLine, hits, win, setWin, note, foe, arm, club, prior,
}: {
  player: Hitter;
  market: BatMarket;
  setMarket: (market: BatMarket) => void;
  rows: Log[];
  all: Log[];
  line: number;
  setLine: (line: number) => void;
  hits: number;
  win: "L5" | "L10" | "L15" | "2026" | "H2H";
  setWin: (w: "L5" | "L10" | "L15" | "2026" | "H2H") => void;
  note?: Edge;
  foe: string;
  arm: Arm | null;
  club: Club | null;
  prior: BvP | null;
}) {
  const nums = rows.map((row) => valueOf(row, market));
  const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const call = !rows.length ? "Pass — no games" : rows.length < 3 ? "Pass — short log" : hits / rows.length >= 0.7 ? "Shape leans over" : hits / rows.length <= 0.35 ? "Shape leans under" : "No clear edge";
  const label = market === "HR" ? "Home runs" : market === "SB" ? "Steals" : market === "H+R+RBI" ? "Hits + runs + RBI" : "Hits";
  const props = (["Hits", "HR", "H+R+RBI", "SB"] as const).map((key) => {
    const name = key === "SB" ? "Steals" : key === "HR" ? "HR" : key === "H+R+RBI" ? "H+R+RBI" : "Hits";
    return { key, name, avg: project(all, key) };
  });
  const windows = (["L5", "L10", "L15", "2026", "H2H"] as const).map((key) => {
    const sample = sliceLog(all, key, foe).map((row) => valueOf(row, market));
    const over = sample.filter((n) => n > line).length;
    const avg = sample.length ? sample.reduce((sum, n) => sum + n, 0) / sample.length : 0;
    return { key, n: sample.length, over, avg, pct: sample.length ? over / sample.length : 0 };
  });
  const support = (["Hits", "HR", "H+R+RBI", "SB"] as const).filter((key) => key !== market).slice(0, 3).map((key) => {
    const sample = rows.map((row) => valueOf(row, key));
    const avg = sample.length ? sample.reduce((sum, n) => sum + n, 0) / sample.length : 0;
    const name = key === "SB" ? "Steals" : key === "HR" ? "HR" : key === "H+R+RBI" ? "H+R+RBI" : "Hits";
    return { key, name, avg, n: sample.length };
  });
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
  const read = batterRead({ name: cleanName(player.name), market, unit, rate: season, n: all.length, recent: hot, recentN: recent.length, foe, vsAvg, vsN: vs.length, arm, club, prior });
  const scale = Math.max(line, ...nums, 1) * 1.25;
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="flex items-center gap-3">
        <Face id={player.id} name={player.name} className="size-12" />
        <div>
          <div className="text-lg font-semibold">{cleanName(player.name)}</div>
          <p className="text-sm text-muted">{player.avg} AVG · {player.hr} HR · {player.rbi} RBI · vs {lastName(foe)}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {props.map((item) => (
          <button key={item.key} type="button" onClick={() => setMarket(item.key)} className={`flex min-h-14 shrink-0 flex-col items-center justify-center rounded-2xl px-3 text-sm ${market === item.key ? "bg-accent text-foreground" : "bg-card text-muted"}`}>
            <span>{item.name}</span>
            <span className="font-mono text-xs font-semibold">{item.avg == null ? "—" : one(item.avg)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Research line</div>
          <div className="font-mono text-3xl font-semibold">{one(line)}</div>
        </div>
        <div className="text-right text-sm text-muted">{rows.length ? `${hits}/${rows.length} over · ${label}` : "No games"}</div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {windows.map((item) => (
          <button key={item.key} type="button" onClick={() => setWin(item.key)} className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-center ${win === item.key ? "bg-accent/30 ring-1 ring-accent" : "bg-card"}`}>
            <span className="text-[10px] text-muted">{item.key}</span>
            <span className={`font-mono text-xs font-semibold ${item.n && item.pct >= 0.5 ? "text-good" : "text-danger"}`}>{item.n ? `${Math.round(item.pct * 100)}%` : "—"}</span>
            <span className="font-mono text-[10px] text-muted">{item.n ? one(item.avg) : "N/A"}</span>
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
      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="size-11 shrink-0 rounded-full bg-card text-lg" aria-label="Lower the line" onClick={() => setLine(Math.max(0, Math.round((line - 0.5) * 10) / 10))}>−</button>
        <input className="h-11 min-w-0 flex-1 accent-accent" type="range" min={0} max={Math.max(line, ...all.map((row) => valueOf(row, market)), 1)} step={0.5} value={line} aria-label="Research line" onChange={(e) => setLine(Number(e.target.value))} />
        <button type="button" className="size-11 shrink-0 rounded-full bg-card text-lg" aria-label="Raise the line" onClick={() => setLine(Math.round((line + 0.5) * 10) / 10)}>+</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {support.map((item) => (
          <div key={item.key} className="rounded-xl bg-card px-2 py-2">
            <div className="text-[10px] uppercase tracking-widest text-muted">{item.name}</div>
            <div className="font-mono text-sm">{item.n ? `${one(item.avg)} avg` : "—"}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">{call}. Average {one(avg)} in this window. Move the line and the colors follow. Not a sportsbook price. {all.length > rows.length ? `Showing ${rows.length} of ${all.length}.` : ""}</p>
      <div className="mt-4 rounded-xl bg-card p-3">
        <div className="text-xs uppercase tracking-widest text-accent">Protected model</div>
        <div className="mt-1 text-lg font-semibold">{read.call}</div>
        <div className="font-mono text-3xl font-semibold">{one(projected)}</div>
        <p className="mt-1 text-sm text-muted">{read.text}</p>
      </div>
      {note ? <p className="mt-2 text-sm text-muted">{note.reasoning}</p> : null}
    </div>
  );
}
