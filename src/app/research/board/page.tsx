"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Game = { id: string; away: string; home: string; awayRecord?: string; homeRecord?: string; spread?: string; total?: string; leanML?: string };

export default function BoardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [week, setWeek] = useState(0);
  useEffect(() => {
    fetch("/api/research/nfl")
      .then((r) => r.json())
      .then((d) => { setGames(d.games || []); setWeek(d.week || 0); })
      .catch(() => setGames([]));
  }, []);
  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#0f1512", color: "#e8eee9", fontFamily: "IBM Plex Sans, system-ui, sans-serif" }}>
      <div className="mx-auto max-w-3xl">
        <Link href="/research" className="text-sm" style={{ color: "#9aa89f" }}>← Research</Link>
        <p className="mt-4 text-xs uppercase tracking-widest" style={{ color: "#62c493" }}>Edge board</p>
        <h1 className="text-3xl font-semibold" style={{ fontFamily: "Saira Condensed, Arial Narrow, sans-serif" }}>Week {week || "—"}</h1>
        <h2 className="mt-6 text-xl" style={{ fontFamily: "Saira Condensed, Arial Narrow, sans-serif" }}>Every game</h2>
        <div className="mt-2 overflow-hidden rounded-lg" style={{ background: "#18211c", border: "1px solid #2b3631" }}>
          {games.map((g) => (
            <Link key={g.id} href={`/research/nfl/game?id=${g.id}`} className="block border-t px-3 py-3" style={{ borderColor: "#2b3631" }}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-lg" style={{ fontFamily: "Saira Condensed, Arial Narrow, sans-serif" }}>{g.away} at {g.home}</div>
                <div className="font-mono text-sm">{g.spread} · {g.total}</div>
              </div>
              <div className="mt-1 text-sm" style={{ color: "#9aa89f" }}>{g.awayRecord} · {g.homeRecord}{g.leanML ? ` · ${g.leanML}` : ""}</div>
            </Link>
          ))}
          {games.length === 0 ? <p className="p-3 text-sm" style={{ color: "#9aa89f" }}>No games loaded.</p> : null}
        </div>
      </div>
    </main>
  );
}
