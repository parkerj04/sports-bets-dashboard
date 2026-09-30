"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Edge, GameMatchup } from "@/lib/mlb";

export default function ResearchPage() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              <div className="text-xs text-muted">MLB edges · live data</div>
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
          <h1 className="text-xl font-bold mb-1">Best plays of the day</h1>
          <p className="text-sm text-muted mb-4">
            Auto-scored from season pitcher K/9 and opposing team strikeout rate.
          </p>
          {loading && <p className="text-muted py-10 text-center">Scanning matchups…</p>}
          {error && !loading && <p className="text-danger text-sm">{error}</p>}
          {!loading && edges.length === 0 && (
            <div className="card p-8 text-center text-muted">
              <p className="mb-1">No strong edges found for today</p>
              <p className="text-xs">No games / probable pitchers listed yet, or matchups are neutral.</p>
            </div>
          )}
          <div className="space-y-3">
            {edges.map((e, i) => (
              <div key={i} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wide">{e.market}</div>
                    <h3 className="font-semibold mt-0.5">{e.pick}</h3>
                    <p className="text-sm text-muted mt-0.5">{e.game}</p>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${scoreColor(e.edgeScore)}`}>{e.edgeScore}</div>
                </div>
                <p className="text-sm leading-relaxed">{e.reasoning}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(e.stats).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 rounded-md bg-white/5 text-muted">
                      {k}: <span className="text-foreground font-medium">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Today’s slate ({games.length} games)
          </h2>
          {games.length === 0 && !loading ? (
            <p className="text-sm text-muted">No MLB games scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {games.map((g) => (
                <div key={g.gamePk} className="card px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{g.awayTeam}</span>
                    <span className="text-muted mx-1.5">@</span>
                    <span className="font-medium">{g.homeTeam}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {g.awayPitcher || "TBD"} vs {g.homePitcher || "TBD"}
                    {g.venue && ` · ${g.venue}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
