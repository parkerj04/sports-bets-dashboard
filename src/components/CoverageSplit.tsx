"use client";

import { useEffect, useMemo, useState } from "react";
import { Stadium } from "@/components/Stadium";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Spot = { loc: string; length: string; n: number };
type Play = { week: string; def: string; loc: string; length: string; air: number | null; yards: number | null; td: boolean; desc: string };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; spots: Spot[]; recent: Play[] };

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
  const star = useMemo(() => [...list].sort((a, b) => b.rec - a.rec)[0]?.name, [list]);
  if (!data) return <p className="text-xs text-muted">Loading 2026 catches…</p>;
  const active = list.find((p) => p.name === picked) || list[0];
  const opp = side === away ? home : away;
  const vs = (active?.recent || []).filter((p) => p.def === opp);
  const last = (active?.recent || []).slice(0, 4);
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick a receiver, see the 2026 catches</h3>
      <p className="text-[11px] text-muted">{data.liveSource} Field is {venue || "this game's venue"}.</p>
      <Stadium venue={venue} home={home} away={away} name={active?.name || ""} spots={active?.spots || []} />
      <div className="flex gap-2">
        <button type="button" onClick={() => { setSide(away); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === away ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{away}</button>
        <button type="button" onClick={() => { setSide(home); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === home ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{home}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${active?.name === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
            {p.name === star ? "★ " : ""}{p.name} {p.rec}
          </button>
        ))}
        {list.length === 0 && <p className="text-xs text-muted">No 2026 catches for {side} yet.</p>}
      </div>
      {active && (
        <div className="text-xs space-y-2 border-t border-card-border pt-3">
          <div className="font-medium">{active.name} vs {opp} · {active.rec} catches, {active.yards} yards, {active.td} TD this year</div>
          <div className="text-muted uppercase tracking-wide">Catches vs this defense</div>
          {vs.length === 0 && <p className="text-muted">No 2026 catch vs {opp} in the file.</p>}
          {vs.map((c, i) => (
            <p key={`v${i}`} className="text-muted">Week {c.week}: {c.length} {c.loc}{c.air != null ? `, ${c.air} air` : ""}, {c.yards} yards{c.td ? ", TD" : ""}. {c.desc}</p>
          ))}
          <div className="text-muted uppercase tracking-wide pt-1">Latest catches</div>
          {last.map((c, i) => (
            <p key={i} className="text-muted">Week {c.week} vs {c.def}: {c.length} {c.loc}{c.air != null ? `, ${c.air} air` : ""}, {c.yards} yards{c.td ? ", TD" : ""}. {c.desc}</p>
          ))}
        </div>
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
