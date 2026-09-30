"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Edge, GameMatchup } from "@/lib/mlb";

export default function ResearchPage() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [market, setMarket] = useState("All");

  useEffect(() => {
    fetch("/api/research")
      .then((r) => r.json())
      .then((data) => {
        setEdges(data.edges || []);
        setGames(data.games || []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Could not load research"))
      .finally(() => setLoading(false));
  }, []);

  const markets = useMemo(() => {
    const set = new Set(edges.map((e) => e.market));
    return ["All", ...Array.from(set)];
  }, [edges]);

  const shown = market === "All" ? edges : edges.filter((e) => e.market === market);

  function scoreColor(score: number) {
    if (score >= 75) return "text-accent";
    if (score >= 60) return "text-warning";
    return "text-muted";
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl">🎯</Link>
            <div>
              <div className="font-semibold text-sm">Research Desk</div>
              <div className="text-xs text-muted">Every game · click through</div>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/picks" className="text-muted hover:text-accent">Picks</Link>
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Today’s slate ({games.length})
          </h2>
          {loading && <p className="text-muted text-sm">Loading slate…</p>}
          <div className="space-y-2">
            {games.map((g) => (
              <Link key={g.gamePk} href={`/research/game?id=${g.gamePk}`} className="card px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm hover:border-accent/40 transition-colors block">
                <div>
                  <span className="font-medium">{g.awayTeam}</span>
                  <span className="text-muted mx-1.5">@</span>
                  <span className="font-medium">{g.homeTeam}</span>
                  <div className="text-xs text-muted mt-0.5">{g.status}{g.venue ? ` · ${g.venue}` : ""}</div>
                </div>
                <div className="text-xs text-right text-muted">
                  <div>{g.awayPitcher || "TBD"}</div>
                  <div>vs {g.homePitcher || "TBD"}</div>
                  <div className="text-accent mt-1">Open game →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h1 className="text-xl font-bold mb-1">Board — all plays</h1>
          <p className="text-sm text-muted mb-3">Ks, team hits, and batter hits from live MLB data.</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {markets.map((m) => (
              <button key={m} onClick={() => setMarket(m)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap ${market === m ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{m}</button>
            ))}
          </div>
          {error && !loading && <p className="text-danger text-sm">{error}</p>}
          {loading && <p className="text-muted py-8 text-center">Scoring every matchup…</p>}
          <div className="space-y-3 mt-3">
            {shown.map((e, i) => (
              <Link key={i} href={e.gamePk ? `/research/game?id=${e.gamePk}` : "/research"} className="card p-4 space-y-2 block hover:border-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wide">{e.market}</div>
                    <h3 className="font-semibold mt-0.5">{e.pick}</h3>
                    <p className="text-sm text-muted mt-0.5">{e.game}</p>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${scoreColor(e.edgeScore)}`}>{e.edgeScore}</div>
                </div>
                <p className="text-sm leading-relaxed">{e.reasoning}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
