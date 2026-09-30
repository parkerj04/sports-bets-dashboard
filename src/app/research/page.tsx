"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Edge, GameMatchup } from "@/lib/mlb";
import type { MlbLine } from "@/lib/mlb-odds";
import type { NflGame } from "@/lib/nfl";
import { BrandMark } from "@/components/Logo";

type SlateGame = GameMatchup & { line?: MlbLine | null };

export default function ResearchPage() {
  const [sport, setSport] = useState<"MLB" | "NFL">("MLB");
  const [edges, setEdges] = useState<Edge[]>([]);
  const [games, setGames] = useState<SlateGame[]>([]);
  const [nfl, setNfl] = useState<{ week: number; games: NflGame[] }>({ week: 0, games: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [market, setMarket] = useState("All");

  useEffect(() => {
    setLoading(true);
    const url = sport === "NFL" ? "/api/research/nfl" : "/api/research";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (sport === "NFL") setNfl({ week: data.week || 0, games: data.games || [] });
        else {
          setEdges(data.edges || []);
          setGames(data.games || []);
        }
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Could not load research"))
      .finally(() => setLoading(false));
  }, [sport]);

  const markets = useMemo(() => ["All", ...Array.from(new Set(edges.map((e) => e.market)))], [edges]);
  const shown = market === "All" ? edges : edges.filter((e) => e.market === market);
  const scoreColor = (score: number) => (score >= 75 ? "text-accent" : score >= 60 ? "text-warning" : "text-muted");

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard"><BrandMark /></Link>
          <Link href="/research/playbook" className="text-sm text-muted hover:text-accent">Playbook</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="flex gap-2">
          {(["MLB", "NFL"] as const).map((s) => (
            <button key={s} onClick={() => setSport(s)} className={`px-4 py-1.5 rounded-full text-sm border ${sport === s ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{s}</button>
          ))}
        </div>

        {sport === "NFL" && (
          <section className="space-y-3">
            <h1 className="text-xl font-bold">NFL Week {nfl.week || "—"}</h1>
            <p className="text-sm text-muted">
              Tap a game for the lab. Checklist:{" "}
              <Link href="/research/nfl-playbook" className="text-accent hover:underline">NFL pre-bet checklist</Link>.
            </p>
            {loading && <p className="text-muted text-sm">Loading NFL…</p>}
            {nfl.games.map((g) => (
              <Link key={g.id} href={`/research/nfl/game?id=${g.id}`} className="card p-4 space-y-2 block hover:border-accent/40">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{g.away} ({g.awayRecord})</div>
                    <div className="text-sm text-muted">at {g.home} ({g.homeRecord})</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${scoreColor(g.leanScore || 0)}`}>{g.leanScore || "—"}</div>
                    <div className="text-[10px] text-accent">Open game →</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Spread</div><div className="font-mono">{g.spread}</div></div>
                  <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Total</div><div className="font-mono">{g.total}</div></div>
                  <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">ML</div><div className="font-mono">{g.mlAway}/{g.mlHome}</div></div>
                </div>
                <div className="text-sm">
                  <span className="text-accent font-medium">{g.leanML}</span>
                  {" · "}
                  <span className="text-accent font-medium">Total: {g.leanTotal}</span>
                </div>
                <p className="text-xs text-muted">{g.leanWhy}</p>
              </Link>
            ))}
          </section>
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
                    {g.line && (
                      <div className="text-[11px] font-mono text-muted mt-1">
                        {g.line.spread} · O/U {g.line.total} · ML {g.line.mlAway}/{g.line.mlHome}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h1 className="text-xl font-bold mb-1">Board</h1>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {markets.map((m) => (
                  <button key={m} onClick={() => setMarket(m)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${market === m ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{m}</button>
                ))}
              </div>
              {error && !loading && <p className="text-danger text-sm">{error}</p>}
              <div className="space-y-3 mt-3">
                {shown.map((e, i) => (
                  <Link key={i} href={e.gamePk ? `/research/game?id=${e.gamePk}` : "/research"} className="card p-4 block">
                    <div className="flex justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted uppercase">{e.market}</div>
                        <h3 className="font-semibold">{e.pick}</h3>
                        <p className="text-sm text-muted">{e.game}</p>
                      </div>
                      <div className={`text-2xl font-bold font-mono ${scoreColor(e.edgeScore)}`}>{e.edgeScore}</div>
                    </div>
                    <p className="text-sm mt-2">{e.reasoning}</p>
                    {e.stats?.["L5 hit rate"] && (
                      <p className="text-xs text-accent mt-2 font-mono">{String(e.stats["L5 hit rate"])}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
