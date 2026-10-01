"use client";

import { useEffect, useState } from "react";

type Trend = { name: string; team: string; market: string; line: number; last4: string; last5: string; last10: string; last5Values: number[]; streak: number; rate: number; why: string };

export function GamePlays({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Trend[]>([]);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/trends?away=${away}&home=${home}`).then((r) => r.json()).then((d) => setRows(d.trends || [])).catch(() => setRows([]));
  }, [away, home]);
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Favorite plays in this game</h3>
      <p className="text-[11px] text-muted">Ranked by last-5 hit rate at the player's own median. Not a book line and not a confidence score.</p>
      {rows.map((t, i) => (
        <div key={t.name + t.market} className="border-t border-card-border pt-2 text-sm">
          <div className="flex justify-between gap-2"><span className="font-semibold">{i + 1}. {t.name} · {t.team}</span><span className="font-mono">{t.rate}%</span></div>
          <div className="text-muted">{t.market} over {t.line}</div>
          <div className="font-mono text-xs">Last 5: {t.last5Values.join(", ")} · {t.last5}</div>
          <p className="text-xs mt-1">{t.why}</p>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-muted">No 2026 trend cleared 60% of the last 5 for these two teams.</p>}
    </section>
  );
}
