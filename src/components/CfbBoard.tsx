"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CfbGame } from "@/lib/cfb";
import { scoreTone } from "@/lib/score-color";

export function CfbBoard() {
  const [week, setWeek] = useState(0);
  const [games, setGames] = useState<CfbGame[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/research/cfb").then((r) => r.json()).then((d) => { setWeek(d.week || 0); setGames(d.games || []); }).finally(() => setLoading(false));
  }, []);
  return (
    <section className="space-y-3">
      <h1 className="text-xl font-bold">College football week {week || "—"}</h1>
      <p className="text-sm text-muted">SEC, Big Ten, Big 12, ACC, plus Notre Dame. Tap a game for the quarterbacks.</p>
      {loading && <p className="text-muted text-sm">Loading college…</p>}
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
