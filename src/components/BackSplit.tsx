"use client";

import { useEffect, useState } from "react";

type Back = {
  name: string; team: string; role: string; carries: number; rushYards: number; rec: number; recYards: number;
  third: number; thirdShare: number; left: number; middle: number; right: number;
  recent: { week: string; def: string; loc: string; yards: number | null; down: string; togo: string; td: boolean }[];
};

export function BackSplit({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Back[] | null>(null);
  const [side, setSide] = useState(away);
  const [picked, setPicked] = useState("");
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/backs?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.players || []);
        const first = (d.players || []).find((p: Back) => p.team === away) || d.players?.[0];
        setPicked(first?.name || "");
        setSide(first?.team || away);
      })
      .catch(() => setRows([]));
  }, [away, home]);
  if (!rows) return <p className="text-xs text-muted">Loading 2026 carries…</p>;
  const list = rows.filter((p) => p.team === side);
  const active = list.find((p) => p.name === picked) || list[0];
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick a back</h3>
      <p className="text-[11px] text-muted">Rushing back, receiving back, or third-down back. Run side is left, middle, right. No invented dots.</p>
      <div className="flex gap-2">
        {[away, home].map((t) => (
          <button key={t} type="button" onClick={() => { setSide(t); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === t ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{t}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${active?.name === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>{p.name}</button>
        ))}
      </div>
      {active && (
        <div className="text-sm space-y-1">
          <div className="font-semibold">{active.name} · {active.role}</div>
          <div className="font-mono text-xs">{active.carries} car, {active.rushYards} rush yds · {active.rec} rec, {active.recYards} rec yds · {active.thirdShare}% of carries on 3rd down</div>
          <div className="font-mono text-xs">Run side: {active.left} left · {active.middle} middle · {active.right} right</div>
          {active.recent.map((p, i) => (
            <div key={i} className="text-xs border-t border-card-border pt-1">Wk {p.week} vs {p.def} · {p.down} and {p.togo} · {p.loc || "run"} · {p.yards} yds{p.td ? " TD" : ""}</div>
          ))}
        </div>
      )}
      {list.length === 0 && <p className="text-xs text-muted">No back with 3 carries in the 2026 file for {side}.</p>}
    </section>
  );
}
