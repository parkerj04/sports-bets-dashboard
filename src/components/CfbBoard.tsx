"use client";
import { useEffect, useState } from "react";
import type { CfbGame } from "@/lib/cfb";
import { toSheet } from "@/lib/cfb-glance";
import { PlayCard } from "@/components/PlayCard";

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
      <h1 className="text-2xl font-semibold tracking-tight">College football week {week || "-"}</h1>
      <p className="text-sm leading-relaxed text-muted">One card per game. Season scoring is on the card. Injuries and the last five are inside the game.</p>
      {loading && <p className="text-muted text-sm">Loading college...</p>}
      {games.map((g) => {
        const side = (g.lean || "").replace(/ ML$/, "") || g.home;
        const price = side === g.home ? g.mlHome : side === g.away ? g.mlAway : "";
        return (
          <PlayCard
            key={g.id}
            href={`/research/cfb/game?id=${g.id}`}
            kicker="CFB"
            title={side}
            price={price}
            when={`${g.away} at ${g.home}`}
            line={`Spread ${g.spread} · Total ${g.total} · ${g.awayQb} vs ${g.homeQb}`}
            sheet={toSheet(g)}
            fors={g.aligns?.length ? g.aligns : ["Nothing in the registry is stacked."]}
            againsts={[...(g.misses || []), "College does not have a charted catch file. Season receptions are inside the game."]}
          />
        );
      })}
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
