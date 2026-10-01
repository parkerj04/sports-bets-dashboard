"use client";

import { useEffect, useMemo, useState } from "react";
import { Stadium } from "@/components/Stadium";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Play = { week: string; def: string; loc: string; length: string; air: number | null; yards: number | null; td: boolean; desc: string; qtr?: string; time?: string; from?: string; to?: string; x?: number | null };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; recent: Play[] };

function scoreWeight(p: Catcher) {
  const endZone = (p.recent || []).filter((c) => (c.x || 0) >= 80 || c.td).length;
  return p.td * 10 + endZone * 2 + p.yards / 100;
}

export function CoverageSplit({ away, home, venue }: { away: string; home: string; venue?: string }) {
  const [data, setData] = useState<{ source: string; liveSource: string; away: Side; home: Side; catches: Catcher[] } | null>(null);
  const [side, setSide] = useState(away);
  const [picked, setPicked] = useState("");
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const first = (d.catches || []).find((p: Catcher) => p.team === away) || d.catches?.[0];
        setPicked(first?.name || "");
        setSide(first?.team || away);
      })
      .catch(() => setData(null));
  }, [away, home]);
  const list = useMemo(() => (data?.catches || []).filter((p) => p.team === side), [data, side]);
  const plus = useMemo(() => [...list].sort((a, b) => b.yards - a.yards)[0], [list]);
  const star = useMemo(() => [...list].sort((a, b) => scoreWeight(b) - scoreWeight(a))[0], [list]);
  if (!data) return <p className="text-xs text-muted">Loading 2026 catches…</p>;
  const active = list.find((p) => p.name === picked) || list[0];
  const opp = side === away ? home : away;
  const vs = (active?.recent || []).filter((p) => p.def === opp);
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick a receiver, see the 2026 catches</h3>
      <p className="text-[11px] text-muted">+ is the receiving-yards lean. ★ is the score lean. Both are from 2026 catches, not a projection model.</p>
      {plus && <p className="text-xs">+ {plus.name} leads this side in yards, {plus.yards} on {plus.rec} catches.</p>}
      {star && <p className="text-xs">★ {star.name} is the score lean, {star.td} TD and the most end-zone or scoring catches.</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => { setSide(away); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === away ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{away}</button>
        <button type="button" onClick={() => { setSide(home); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === home ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{home}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${active?.name === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
            {p.name === plus?.name ? "+ " : ""}{p.name === star?.name ? "★ " : ""}{p.name} {p.rec}
          </button>
        ))}
      </div>
      <Stadium venue={venue} home={home} away={away} name={active?.name || ""} rec={active?.rec || 0} plays={active?.recent || []} />
      {active && (
        <p className="text-xs text-muted">{vs.length} of these were vs {opp}.</p>
      )}
      <h3 className="font-semibold text-sm pt-2">2025 coverage splits</h3>
      <p className="text-[11px] text-muted">{data.source}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideCard name={away} side={data.away} tag={heavy(data.away)} />
        <SideCard name={home} side={data.home} tag={heavy(data.home)} />
      </div>
    </div>
  );
}

function SideCard({ name, side, tag }: { name: string; side: Side; tag: string }) {
  if (!side) return <div className="bg-white/5 rounded-lg p-2">{name}: no 2025 chart</div>;
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="font-medium">{name} defense · 2025</div>
      <div className="font-mono">{side.zonePct}% zone · {side.manPct}% man</div>
      <div className="text-muted">{tag} · {side.snaps} charted snaps</div>
    </div>
  );
}
