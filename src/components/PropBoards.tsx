"use client";

import { useEffect, useState } from "react";

type Card = { game: string; pick: string; score: number; why: string };

export function PropBoards({ sport }: { sport: "MLB" | "NFL" }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    const url = sport === "NFL" ? "/api/research/nfl/td" : "/api/research/hr";
    fetch(url).then((r) => r.json()).then((d) => { setCards(d.cards || []); setNote(d.note || ""); }).catch(() => setCards([]));
  }, [sport]);
  if (!cards.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{sport === "NFL" ? "Anytime TD, matchup board" : "Home run, matchup board"}</h2>
      <p className="text-xs text-muted">{note}</p>
      {cards.map((c, i) => (
        <div key={i} className="card p-4">
          <div className="flex justify-between gap-3">
            <div>
              <div className="font-semibold">{c.pick}</div>
              <div className="text-xs text-muted">{c.game}</div>
            </div>
            <div className="font-mono text-xl text-accent">{c.score}</div>
          </div>
          <p className="text-sm text-muted mt-2">{c.why}</p>
        </div>
      ))}
    </section>
  );
}
