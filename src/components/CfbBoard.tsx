"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CfbGame } from "@/lib/cfb";

export function CfbBoard() {
  const [week, setWeek] = useState(0);
  const [games, setGames] = useState<CfbGame[]>([]);
  const [results, setResults] = useState<{ id: string; scoreline: string; cards: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/research/cfb").then((r) => r.json()).then((d) => { setWeek(d.week || 0); setGames(d.games || []); setResults(d.results || []); }).finally(() => setLoading(false));
  }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">College football week {week || "—"}</h1>
      <p className="text-sm text-muted">Tap a game. The quarterbacks are inside.</p>
      {loading && <p className="text-muted text-sm">Loading college…</p>}
      {games.map((g) => (
        <Link key={g.id} href={`/research/cfb/game?id=${g.id}`} className="card block p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold">{g.away} <span className="font-normal text-muted">{g.awayRecord}</span></div>
              <div className="text-sm text-muted">at {g.home} {g.homeRecord}</div>
              <p className="mt-2 truncate text-sm">{g.awayQb} <span className="text-muted">vs</span> {g.homeQb}</p>
            </div>
            <div className="text-right font-mono text-sm">
              <div>{g.spread}</div>
              <div className="text-muted">O/U {g.total}</div>
            </div>
          </div>
        </Link>
      ))}
      {results.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-semibold">Results</summary>
          <div className="mt-3 space-y-2">
            {results.map((r) => (
              <div key={r.id} className="border-t border-card-border pt-2 text-sm">
                <div className="font-medium">{r.scoreline}</div>
                {r.cards.map((c) => <p key={c} className="mt-1 text-xs text-muted">{c}</p>)}
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
