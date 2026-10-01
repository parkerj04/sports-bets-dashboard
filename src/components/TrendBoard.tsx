"use client";

import { useEffect, useState } from "react";

type Trend = { name: string; team: string; market: string; line: number; last4: string; last5: string; last10: string; streak: number; rate: number };

export function TrendBoard() {
  const [rows, setRows] = useState<Trend[]>([]);
  const [source, setSource] = useState("");
  useEffect(() => {
    fetch("/api/research/nfl/trends").then((r) => r.json()).then((d) => { setRows(d.trends || []); setSource(d.source || ""); }).catch(() => setRows([]));
  }, []);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">Trend strength</h2>
      <p className="text-xs text-muted">{source || "Loading 2026 trends…"} This is not a confidence score.</p>
      {rows.map((t, i) => (
        <div key={t.name + t.market} className="card p-3 text-sm">
          <div className="flex justify-between gap-2"><span className="font-semibold">{i + 1}. {t.name} · {t.team}</span><span className="font-mono text-good">{t.rate}%</span></div>
          <div className="text-muted">{t.market} over {t.line} · own median</div>
          <div className="mt-1 font-mono text-xs">{t.last4} last 4 · {t.last5} last 5 · {t.last10} last 10 · {t.streak}-game streak</div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-muted">No trend cleared 80% of the last 5 at his own median.</p>}
    </section>
  );
}
