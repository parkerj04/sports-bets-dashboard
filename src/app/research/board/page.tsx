"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Game = { id: string; away: string; home: string; spread?: string; total?: string; mlAway?: string; mlHome?: string; leanML?: string; kickoff?: string };

export default function BoardPage() {
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    fetch("/api/research/nfl")
      .then((r) => r.json())
      .then((d) => setGames(d.games || []))
      .catch(() => setGames([]));
  }, []);
  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#101614", color: "#e8eee9" }}>
      <div className="mx-auto max-w-lg">
        <Link href="/research" className="text-sm" style={{ color: "#9aa89f" }}>← Research</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">BEST BETS</h1>
        <p className="mt-2 text-sm leading-6" style={{ color: "#b7c2bb" }}>
          Only a play with a posted price and a case against. A model percent is not printed until it is counted against that price.
        </p>
        <div className="mt-4 space-y-3">
          {games.map((g) => (
            <article key={g.id} className="rounded-2xl p-3" style={{ background: "#1a2420", border: "1px solid #2b3631" }}>
              <div className="rounded-xl p-3" style={{ border: "1px solid #2b3631" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-semibold">{g.home}</div>
                    <div className="font-mono text-xl">{g.spread || "NL"}</div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs" style={{ background: "#3a2c17", color: "#e6aa55" }}>NO PROVEN EDGE</span>
                </div>
              </div>
              <p className="mt-3 text-sm" style={{ color: "#c5d0c9" }}>
                {g.away} at {g.home}. Line: {g.spread || "NL"} · O/U {g.total || "NL"}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Why this pick</summary>
                <div className="mt-2 text-sm leading-6">
                  <p>{g.leanML || "No lean on this game."}</p>
                  <p className="mt-2" style={{ color: "#62c493" }}>The case for</p>
                  <p>The posted number is {g.spread || "missing"}. Implied total {g.total || "missing"}.</p>
                  <p className="mt-2" style={{ color: "#f08072" }}>The case against</p>
                  <p>No model percent is on this card. A price without a counted chance is not a value tag.</p>
                </div>
              </details>
              <Link href={`/research/nfl/game?id=${g.id}`} className="mt-3 block text-sm" style={{ color: "#62c493" }}>Open the game</Link>
            </article>
          ))}
          {games.length === 0 ? <p className="text-sm" style={{ color: "#9aa89f" }}>No games loaded.</p> : null}
        </div>
      </div>
    </main>
  );
}
