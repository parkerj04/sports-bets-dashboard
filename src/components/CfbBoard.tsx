"use client";
import { useEffect, useState } from "react";
import type { CfbGame } from "@/lib/cfb";

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
      <p className="text-sm text-muted">QB season line is the read. Spread is shown so you can shop it, not so it picks the side.</p>
      {loading && <p className="text-muted text-sm">Loading college…</p>}
      {games.map((g) => (
        <div key={g.id} className="card p-4 space-y-2">
          <div className="flex justify-between gap-3">
            <div>
              <div className="font-semibold">{g.away} ({g.awayRecord})</div>
              <div className="text-sm text-muted">at {g.home} ({g.homeRecord})</div>
            </div>
            <div className="font-mono text-2xl text-accent">{g.score}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2"><div className="text-muted">Away QB</div><div className="font-medium">{g.awayQb}</div><div className="font-mono text-muted">{g.awayQbLine}</div></div>
            <div className="bg-white/5 rounded-lg p-2"><div className="text-muted">Home QB</div><div className="font-medium">{g.homeQb}</div><div className="font-mono text-muted">{g.homeQbLine}</div></div>
          </div>
          <div className="text-xs font-mono text-muted">{g.spread} · O/U {g.total} · ML {g.mlAway}/{g.mlHome}</div>
          <div className="text-sm text-accent">{g.lean}</div>
          <p className="text-xs text-muted">{g.why}</p>
        </div>
      ))}
    </section>
  );
}
