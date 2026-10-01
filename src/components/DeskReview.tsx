"use client";

import { activeLessons, REVIEW_TAGS } from "@/lib/calibrate";
import type { Bet } from "@/lib/types";

export function DeskReview({ picks, onTag }: { picks: Bet[]; onTag: (id: string, tag: string) => void }) {
  const settled = picks.filter((p) => p.status === "won" || p.status === "lost" || p.status === "push");
  const losses = settled.filter((p) => p.status === "lost");
  const wins = settled.filter((p) => p.status === "won");
  const lessons = activeLessons();
  return (
    <section className="card p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Desk review</h2>
        <p className="text-xs text-muted mt-1">Wins do not raise the next score. A loss only changes the next card if the process was wrong. Variance stays a note, not a new rule.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Settled</div><div className="font-mono text-sm">{settled.length}</div></div>
        <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Wins</div><div className="font-mono text-sm text-good">{wins.length}</div></div>
        <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Losses</div><div className="font-mono text-sm text-danger">{losses.length}</div></div>
      </div>
      <div className="space-y-2">
        {lessons.map((l) => (
          <div key={l.id} className="text-xs border-t border-card-border pt-2">
            <div className="font-medium">{l.market} · {l.result}</div>
            <p className="text-muted">{l.flaw}</p>
            <p className="mt-1">{l.rule}</p>
          </div>
        ))}
      </div>
      {losses.slice(0, 5).map((p) => (
        <div key={p.id} className="text-xs border-t border-card-border pt-2 space-y-1">
          <div className="font-medium">{p.selection}</div>
          <div className="text-muted">{p.event}</div>
          <div className="flex flex-wrap gap-1">
            {REVIEW_TAGS.map((tag) => (
              <button key={tag} type="button" onClick={() => onTag(p.id, tag)} className="px-2 py-1 rounded-md border border-card-border text-muted">
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
