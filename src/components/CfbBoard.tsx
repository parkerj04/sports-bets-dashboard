"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CfbGame } from "@/lib/cfb";
import { scoreTone } from "@/lib/score-color";

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
      <h1 className="text-xl font-bold">College football week {week || "—"}</h1>
      <p className="text-sm text-muted">SEC, Big Ten, Big 12, ACC, plus Notre Dame. Finals are off the slate. In progress stays.</p>
      {loading && <p className="text-muted text-sm">Loading college…</p>}
      {results.length > 0 && (
        <div className="card p-4 space-y-2">
          <h2 className="font-semibold text-sm">Results</h2>
          {results.map((r) => (
            <div key={r.id} className="text-sm border-t border-card-border pt-2">
              <div className="font-medium">{r.scoreline}</div>
              {r.cards.map((c) => <p key={c} className="text-xs text-muted mt-1">{c}</p>)}
            </div>
          ))}
        </div>
      )}
      {games.map((g) => (
        <Link key={g.id} href={`/research/cfb/game?id=${g.id}`} className="card p-4 space-y-2 block hover:border-accent/40">
          <div className="flex justify-between gap-3">
            <div>
              <div className="font-semibold">{g.away} ({g.awayRecord})</div>
              <div className="text-sm text-muted">at {g.home} ({g.homeRecord})</div>
              <div className="text-[11px] text-muted">{g.awayConf} / {g.homeConf}</div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-2xl ${scoreTone(g.score)}`}>{g.score}</div>
              <div className="text-[10px] text-accent">QBs →</div>
            </div>
          </div>
          <div className="text-xs font-mono text-muted">{g.spread} · O/U {g.total}</div>
          <div className="text-sm">{g.awayQb} vs {g.homeQb}</div>
        </Link>
      ))}
    </section>
  );
}
