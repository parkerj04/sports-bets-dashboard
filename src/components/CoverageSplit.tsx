"use client";

import { useEffect, useMemo, useState } from "react";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Player = { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number };
type Spot = { loc: string; length: string; n: number };
type Play = { week: string; def: string; loc: string; length: string; air: number | null; yards: number | null; td: boolean; desc: string };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; spots: Spot[]; recent: Play[] };

const X: Record<string, number> = { left: 28, middle: 50, right: 72 };
const Y: Record<string, number> = { short: 56, deep: 28 };

export function CoverageSplit({ away, home }: { away: string; home: string }) {
  const [data, setData] = useState<{ source: string; liveSource: string; away: Side; home: Side; players: Player[]; catches: Catcher[] } | null>(null);
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
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick a receiver, see the 2026 catches</h3>
      <p className="text-[11px] text-muted">{data.liveSource} Refreshes from the file after games. Star is the most catches on this side.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => { setSide(away); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === away ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{away}</button>
        <button type="button" onClick={() => { setSide(home); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === home ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{home}</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${active?.name === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
              {p.name === star ? "★ " : ""}{p.name} {p.rec}
            </button>
          ))}
          {list.length === 0 && <p className="text-xs text-muted">No 2026 catches for {side} yet.</p>}
        </div>
        <Field name={active?.name || ""} spots={active?.spots || []} />
      </div>
      {active && (
        <div className="text-xs space-y-2 border-t border-card-border pt-3">
          <div className="font-medium">{active.name} vs {opp} · {active.rec} catches, {active.yards} yards, {active.td} TD this year</div>
          <div className="text-muted uppercase tracking-wide">Catches vs this defense</div>
          {vs.length === 0 && <p className="text-muted">No 2026 catch vs {opp} in the file. The field is the rest of his season, not a made-up matchup.</p>}
          {vs.map((c, i) => (
            <p key={`v${i}`} className="text-muted">Week {c.week}: {c.length} {c.loc}{c.air != null ? `, ${c.air} air` : ""}, {c.yards} yards{c.td ? ", TD" : ""}. {c.desc}</p>
          ))}
          <div className="text-muted uppercase tracking-wide pt-1">Last located catches</div>
          {active.recent.map((c, i) => (
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

function Field({ name, spots }: { name: string; spots: Spot[] }) {
  const drawn = spots.filter((s) => X[s.loc] && Y[s.length]);
  return (
    <div>
      <div className="text-xs text-muted mb-1">{name || "Pick a name"} · 2026</div>
      <svg viewBox="0 0 100 70" className="w-full rounded-lg bg-[#16331f] border border-card-border">
        <rect x="4" y="4" width="92" height="62" fill="none" stroke="#d7d2c8" strokeWidth="0.6" />
        <line x1="50" y1="4" x2="50" y2="66" stroke="#d7d2c8" strokeWidth="0.4" />
        <text x="28" y="12" fontSize="3" fill="#d7d2c8" textAnchor="middle">left</text>
        <text x="50" y="12" fontSize="3" fill="#d7d2c8" textAnchor="middle">middle</text>
        <text x="72" y="12" fontSize="3" fill="#d7d2c8" textAnchor="middle">right</text>
        {drawn.map((s, i) => (
          <g key={i}>
            <circle cx={X[s.loc]} cy={Y[s.length]} r={2.5 + Math.min(5, s.n)} fill="#e2b657" fillOpacity="0.9" />
            <text x={X[s.loc]} y={Y[s.length] + 1} textAnchor="middle" fontSize="2.6" fill="#111">{s.n}</text>
          </g>
        ))}
      </svg>
      <div className="text-[11px] text-muted mt-1">{drawn.map((s) => `${s.n} ${s.length} ${s.loc}`).join(" · ") || "No located catch."}</div>
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
