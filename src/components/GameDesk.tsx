"use client";

import { useEffect, useState } from "react";
import { scoreTone } from "@/lib/score-color";

type Card = { pick: string; score: number; why: string };

export function GameDesk({ id }: { id: string }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!id) return;
    fetch(`/api/research/nfl/td?id=${id}`).then((r) => r.json()).then((d) => { setCards(d.cards || []); setNote(d.note || ""); }).catch(() => setCards([]));
  }, [id]);
  const top = cards.slice(0, 2);
  const parlay = top.length === 2 && top[0].pick.split(" ")[0] !== top[1].pick.split(" ")[0];
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Researched plays</h3>
      <p className="text-[11px] text-muted">{note || "Loading this game's board…"}</p>
      {cards.map((c, i) => (
        <div key={c.pick} className="border-t border-card-border pt-2">
          <div className="flex justify-between gap-2"><span className="font-semibold text-sm">{i + 1}. {c.pick}</span><span className={`font-mono ${scoreTone(c.score)}`}>{c.score}</span></div>
          <p className="text-xs text-muted mt-1">{c.why}</p>
        </div>
      ))}
      {parlay && (
        <div className="border-t border-card-border pt-2 text-sm">
          <div className="font-semibold">Parlay lean, not a lock</div>
          <p className="text-xs text-muted mt-1">{top[0].pick} with {top[1].pick}. Same game, so the legs are correlated. Only if both numbers are plus money. No price in this feed, so this is a shape, not a ticket.</p>
        </div>
      )}
      {cards.length === 0 && <p className="text-xs text-muted">No touchdown shape for this game in the charted file.</p>}
    </section>
  );
}
