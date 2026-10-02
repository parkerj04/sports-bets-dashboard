"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string; status?: string };

function ticketOf(p: Play) {
  const m = `${p.id} ${p.pick}`.match(/\bP(\d+)\b|p(\d+)-leg/i);
  return m ? `P${m[1] || m[2]}` : "";
}

function Board({ title, rows }: { title: string; rows: Play[] }) {
  if (!rows.length) return null;
  const groups = new Map<string, Play[]>();
  const singles: Play[] = [];
  for (const p of rows) {
    const ticket = ticketOf(p);
    if (!ticket) singles.push(p);
    else groups.set(ticket, [...(groups.get(ticket) || []), p]);
  }
  const tickets = Array.from(groups.entries());
  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {singles.map((p, i) => (
        <div key={p.id} className="card p-4 text-sm">
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{i + 1}. {p.pick}</span>
            <span className="font-mono">{p.score}</span>
          </div>
          <p className="text-xs mt-1">{p.why}</p>
        </div>
      ))}
      {tickets.map(([name, legs]) => (
        <div key={name} className="card p-4 text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{name} · {legs.length} legs</span>
            <span className="font-mono">{Math.min(...legs.map((l) => l.score))}</span>
          </div>
          {legs.map((l) => (
            <div key={l.id} className="border-t border-card-border pt-2">
              <div className="font-medium">{l.pick.replace(/\s*\(P\d+ leg \d+\/\d+\)/, "")}</div>
              <p className="text-xs mt-1 text-muted">{l.why}</p>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

export function AgentDesk({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Play[]>([]);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/agent/plays?away=${encodeURIComponent(away)}&home=${encodeURIComponent(home)}`)
      .then((r) => r.json())
      .then((d) => setRows((d.plays || []).slice().sort((a: Play, b: Play) => b.score - a.score)))
      .catch(() => setRows([]));
  }, [away, home]);
  const published = rows.filter((p) => p.status === "published");
  const review = rows.filter((p) => p.status !== "published");
  if (!rows.length) return null;
  return (
    <>
      <Board title="Willie Parker's Picks" rows={published} />
      <Board title="Willie Parker's Picks · in review" rows={review} />
    </>
  );
}
