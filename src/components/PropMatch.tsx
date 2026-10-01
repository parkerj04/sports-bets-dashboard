"use client";

import { useEffect, useState } from "react";

type Prop = { name: string; team: string; opp: string; line: number; last5: number[]; hit: string; prior: { week: string; yards: number }[]; why: string };

export function PropMatch({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Prop[] | null>(null);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/props?away=${away}&home=${home}`).then((r) => r.json()).then((d) => setRows(d.props || [])).catch(() => setRows([]));
  }, [away, home]);
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Receiving props, 25+</h3>
      <p className="text-[11px] text-muted">Last 5 this year, then 2025 games against this defense. 25 is an alt shape, not a book number.</p>
      {rows === null && <p className="text-xs text-muted">Loading 2026 and 2025 logs…</p>}
      {rows?.map((p) => (
        <div key={p.name} className="border-t border-card-border pt-2 text-sm">
          <div className="font-semibold">{p.name} · {p.team} over {p.line}</div>
          <div className="font-mono text-xs">Last 5: {p.last5.join(", ")} · {p.hit}</div>
          <div className="text-xs text-muted">2025 vs {p.opp}: {p.prior.length ? p.prior.map((g) => `W${g.week} ${g.yards}`).join(", ") : "none"}</div>
          <p className="text-xs mt-1">{p.why}</p>
        </div>
      ))}
      {rows && rows.length === 0 && <p className="text-xs text-muted">Nobody on these two teams cleared 25 in 3 of the last 5.</p>}
    </section>
  );
}
