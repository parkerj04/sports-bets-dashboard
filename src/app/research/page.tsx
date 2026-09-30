"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Edge, GameMatchup } from "@/lib/mlb";
import type { MlbLine } from "@/lib/mlb-odds";
import type { NflGame } from "@/lib/nfl";
import { BrandMark } from "@/components/Logo";
import { PropBoards } from "@/components/PropBoards";
import { CfbBoard } from "@/components/CfbBoard";
import { SportPicks } from "@/components/SportPicks";
import { SlipCheck, SlipTray } from "@/components/SlipTray";
import { scoreTone } from "@/lib/score-color";
import { isPlayable } from "@/lib/edges";

type Sport = "MLB" | "NFL" | "CFB";
type SlateGame = GameMatchup & { line?: MlbLine | null };

export default function ResearchPage() {
  const [sport, setSport] = useState<Sport>("MLB");
  const [edges, setEdges] = useState<Edge[]>([]);
  const [games, setGames] = useState<SlateGame[]>([]);
  const [nfl, setNfl] = useState<{ week: number; games: NflGame[] }>({ week: 0, games: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [market, setMarket] = useState("All");

  useEffect(() => {
    if (sport === "CFB") { setLoading(false); return; }
    setLoading(true);
    const url = sport === "NFL" ? "/api/research/nfl" : "/api/research";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (sport === "NFL") setNfl({ week: data.week || 0, games: data.games || [] });
        else { setEdges(data.edges || []); setGames(data.games || []); }
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Could not load research"))
      .finally(() => setLoading(false));
  }, [sport]);

  const markets = useMemo(() => ["All", ...Array.from(new Set(edges.map((e) => e.market)))], [edges]);
  const shown = market === "All" ? edges : edges.filter((e) => e.market === market);
  const playable = shown.filter(isPlayable);
  const watch = shown.filter((e) => !isPlayable(e));

  function card(e: Edge, i: number, live: boolean) {
    return (
      <div key={`${e.gamePk}-${e.market}-${e.pick}-${i}`} className="card p-4 space-y-2">
        <div className="flex justify-between gap-3">
          <div>
            <div className="text-xs text-muted uppercase">{e.market}{live ? "" : " · research only"}</div>
            <h3 className="font-semibold">{e.pick}</h3>
            <p className="text-sm text-muted">{e.game}</p>
          </div>
          <div className={`text-2xl font-bold font-mono ${scoreTone(e.edgeScore)}`}>{e.edgeScore}</div>
        </div>
        <p className="text-sm">{e.reasoning}</p>
        <div className="flex items-center justify-between gap-2">
          <SlipCheck item={{
            id: `${e.gamePk}-${e.market}-${e.pick}`,
            sport: "MLB",
            game: e.game,
            market: e.market,
            pick: e.pick,
            score: e.edgeScore,
            why: e.reasoning,
            playable: live,
          }} />
          {e.gamePk ? <Link href={`/research/game?id=${e.gamePk}`} className="text-xs text-accent">Open game →</Link> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard"><BrandMark /></Link>
          <Link href="/research/playbook" className="text-sm text-muted hover:text-accent">Playbook</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="flex gap-2">
          {(["MLB", "NFL", "CFB"] as const).map((s) => (
            <button key={s} onClick={() => setSport(s)} className={`px-4 py-1.5 rounded-full text-sm border ${sport === s ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{s}</button>
          ))}
        </div>
        {sport === "CFB" && (
          <>
            <CfbBoard />
            <SportPicks sport="CFB" />
          </>
        )}
        {sport === "NFL" && (
          <>
            <section className="space-y-3">
              <h1 className="text-xl font-bold">NFL Week {nfl.week || "—"}</h1>
              <p className="text-sm text-muted">Tap a game for the lab. Checklist: <Link href="/research/nfl-playbook" className="text-accent hover:underline">NFL pre-bet checklist</Link>.</p>
              {loading && <p className="text-muted text-sm">Loading NFL…</p>}
              {nfl.games.map((g) => (
                <Link key={g.id} href={`/research/nfl/game?id=${g.id}`} className="card p-4 space-y-2 block hover:border-accent/40">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-semibold">{g.away} ({g.awayRecord})</div>
                      <div className="text-sm text-muted">at {g.home} ({g.homeRecord})</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-mono font-bold ${scoreTone(g.leanScore || 0)}`}>{g.leanScore || "—"}</div>
                      <div className="text-[10px] text-accent">Open game →</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Spread</div><div className="font-mono">{g.spread}</div></div>
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Total</div><div className="font-mono">{g.total}</div></div>
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">ML</div><div className="font-mono">{g.mlAway}/{g.mlHome}</div></div>
                  </div>
                  <div className="text-sm"><span className="text-accent font-medium">{g.leanML}</span>{" · "}<span className="text-accent font-medium">Total: {g.leanTotal}</span></div>
                  <p className="text-xs text-muted">{g.leanWhy}</p>
                </Link>
              ))}
            </section>
            <SportPicks sport="NFL" />
            <PropBoards sport="NFL" />
          </>
        )}
        {sport === "MLB" && (
          <>
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Today’s slate ({games.length})</h2>
              {loading && <p className="text-muted text-sm">Loading slate…</p>}
              <div className="space-y-2">
                {games.map((g) => (
                  <Link key={g.gamePk} href={`/research/game?id=${g.gamePk}`} className="card px-4 py-3 block hover:border-accent/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div>
                        <span className="font-medium">{g.awayTeam}</span>
                        <span className="text-muted mx-1.5">@</span>
                        <span className="font-medium">{g.homeTeam}</span>
                      </div>
                      <div className="text-xs text-accent">Open game →</div>
                    </div>
                    {g.line && <div className="text-[11px] font-mono text-muted mt-1">{g.line.spread} · O/U {g.line.total} · ML {g.line.mlAway}/{g.line.mlHome}</div>}
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h1 className="text-xl font-bold mb-1">Board</h1>
              <p className="text-xs text-muted mb-2">Playable = score 64+ with no contact/walk flags. Everything else is research only. Check cards onto the slip, then copy the list for Gamblybot.</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {markets.map((m) => (
                  <button key={m} onClick={() => setMarket(m)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${market === m ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{m}</button>
                ))}
              </div>
              {error && !loading && <p className="text-danger text-sm">{error}</p>}
              <h2 className="text-sm font-semibold mt-4 mb-2 text-good">Playable</h2>
              <div className="space-y-3">{playable.map((e, i) => card(e, i, true))}</div>
              {!playable.length && <p className="text-xs text-muted">Nothing cleared the playable bar on this filter.</p>}
              <h2 className="text-sm font-semibold mt-6 mb-2 text-danger">Research only</h2>
              <div className="space-y-3">{watch.map((e, i) => card(e, i, false))}</div>
            </section>
            <PropBoards sport="MLB" />
          </>
        )}
      </main>
      <SlipTray />
    </div>
  );
}
