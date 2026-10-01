"use client";

import { useEffect, useState } from "react";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Player = { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number };
type Spot = { loc: string; length: string; n: number };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; spots: Spot[]; recent: { week: string; def: string; loc: string; length: string; air: number | null; yards: number | null; td: boolean; desc: string }[] };

const X: Record<string, number> = { left: 28, middle: 50, right: 72 };
const Y: Record<string, number> = { short: 56, deep: 28 };

export function CoverageSplit({ away, home }: { away: string; home: string }) {
  const [data, setData] = useState<{ source: string; liveSource: string; away: Side; home: Side; players: Player[]; catches: Catcher[] } | null>(null);
  const [picked, setPicked] = useState("");
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setPicked(d.catches?.[0]?.name || ""); })
      .catch(() => setData(null));
  }, [away, home]);
  if (!data) return null;
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  const active = data.catches.find((p) => p.name === picked);
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">2026 catches</h3>
      <p className="text-[11px] text-muted">{data.liveSource}</p>
      <div className="flex flex-wrap gap-2">
        {data.catches.map((p) => (
          <button key={p.team + p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${picked === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
            {p.name} {p.rec}
          </button>
        ))}
      </div>
      <Field name={picked} spots={active?.spots || []} />
      {active && (
        <div className="text-xs space-y-2">
          <div className="font-medium">{active.name} · {active.rec} catches · {active.yards} yards · {active.td} TD</div>
          {active.recent.map((c, i) => (
            <p key={i} className="text-muted">Week {c.week} vs {c.def}: {c.length} {c.loc}{c.air != null ? `, ${c.air} air yards` : ""}, {c.yards} yards{c.td ? ", TD" : ""}. {c.desc}</p>
          ))}
        </div>
      )}
      <h3 className="font-semibold text-sm pt-2">2025 coverage splits</h3>
      <p className="text-[11px] text-muted">{data.source}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideCard name={away} side={data.away} tag={heavy(data.away)} />
        <SideCard name={home} side={data.home} tag={heavy(data.home)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted"><tr className="text-left"><th className="pb-2">2025 target</th><th>Tgt</th><th>Zone</th><th>Man</th><th>Zone%</th><th>Catch%</th></tr></thead>
          <tbody>
            {data.players.map((p) => (
              <tr key={p.team + p.name} className="border-t border-card-border font-mono">
                <td className="py-1.5 font-sans">{p.name} <span className="text-muted">{p.team}</span></td>
                <td>{p.tgt}</td><td>{p.zoneTgt}</td><td>{p.manTgt}</td><td>{p.zonePct}</td><td>{p.compPct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ name, spots }: { name: string; spots: Spot[] }) {
  const drawn = spots.filter((s) => X[s.loc] && Y[s.length]);
  return (
    <div>
      <div className="text-xs text-muted mb-1">{name || "Pick a name"} · 2026 location from the play</div>
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
      <div className="text-[11px] text-muted mt-1">{drawn.map((s) => `${s.n} ${s.length} ${s.loc}`).join(" · ") || "No located catch for this name."}</div>
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
