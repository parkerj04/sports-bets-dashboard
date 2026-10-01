"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string };

export function AgentDesk({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Play[]>([]);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/agent/plays?away=${away}&home=${home}`).then((r) => r.json()).then((d) => setRows(d.plays || [])).catch(() => setRows([]));
  }, [away, home]);
  if (!rows.length) return null;
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Agent desk</h3>
      {rows.map((p) => (
        <div key={p.id} className="border-t border-card-border pt-2 text-sm">
          <div className="flex justify-between gap-2"><span className="font-semibold">{p.pick}</span><span className="font-mono">{p.score}</span></div>
          <p className="text-xs mt-1">{p.why}</p>
        </div>
      ))}
    </section>
  );
}
