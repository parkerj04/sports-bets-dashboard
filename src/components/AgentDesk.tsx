"use client";

import { useEffect, useState } from "react";

type Play = { id: string; game: string; away: string; home: string; pick: string; score: number | null; why: string; status?: string };

function agentOf(id: string) {
  const name = (id || "").split("-")[0];
  return name ? name[0].toUpperCase() + name.slice(1) : "Agent";
}

export function AgentDesk({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Play[] | null>(null);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/agent/plays?away=${encodeURIComponent(away)}&home=${encodeURIComponent(home)}`)
      .then((r) => r.json())
      .then((d) => setRows(d.plays || []))
      .catch(() => setRows([]));
  }, [away, home]);
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Agent cards</h2>
      <p className="text-xs text-muted">Every card stays. The name is the agent. Nothing is cut here.</p>
      {rows === null ? <p className="text-xs text-muted">Loading cards…</p> : null}
      {rows && rows.length === 0 ? <p className="text-xs text-muted">No card for this game.</p> : null}
      {rows?.map((p) => (
        <article key={p.id} className="border p-3 text-sm" style={{ borderColor: "#2c2c28" }}>
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-medium">{agentOf(p.id)} · {p.pick}</div>
            <div className="font-mono text-xs text-muted">{p.score ?? "—"}</div>
          </div>
          <p className="mt-2 text-muted">{p.why}</p>
        </article>
      ))}
    </section>
  );
}
