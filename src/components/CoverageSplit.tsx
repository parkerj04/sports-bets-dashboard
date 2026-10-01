"use client";

import { useEffect, useState } from "react";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Player = { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number };
type Spot = { x: number; y: number; n: number; tag: string };

export function CoverageSplit({ away, home }: { away: string; home: string }) {
  const [data, setData] = useState<{ source: string; away: Side; home: Side; players: Player[]; spots: { name: string; team: string; spots: Spot[] }[]; note: string } | null>(null);
  const [picked, setPicked] = useState("");
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setPicked(d.players?.[0]?.name || ""); })
      .catch(() => setData(null));
  }, [away, home]);
  if (!data) return null;
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  const active = data.spots.find((p) => p.name === picked);
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Coverage splits</h3>
      <p className="text-[11px] text-muted">{data.source} Calvin Austin and Jonnu Smith are off the Steelers chart.</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideCard name={away} side={data.away} tag={heavy(data.away)} />
        <SideCard name={home} side={data.home} tag={heavy(data.home)} />
      </div>
      <Field name={picked} spots={active?.spots || []} />
      <p className="text-[11px] text-muted">{data.note}</p>
      <div className="flex flex-wrap gap-2">
        {data.players.map((p) => (
          <button key={p.team + p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${picked === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted">
            <tr className="text-left">
              <th className="pb-2">Targeted</th><th>Tgt</th><th>Zone</th><th>Man</th><th>Zone%</th><th>Catch%</th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((p) => (
              <tr key={p.team + p.name} onClick={() => setPicked(p.name)} className="border-t border-card-border font-mono cursor-pointer">
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
  return (
    <div>
      <div className="text-xs text-muted mb-1">{name || "Pick a name"} · target areas</div>
      <svg viewBox="0 0 100 70" className="w-full rounded-lg bg-[#16331f] border border-card-border">
        <rect x="4" y="4" width="92" height="62" fill="none" stroke="#d7d2c8" strokeWidth="0.6" />
        <line x1="50" y1="4" x2="50" y2="66" stroke="#d7d2c8" strokeWidth="0.4" />
        <rect x="30" y="8" width="40" height="12" fill="none" stroke="#d7d2c8" strokeWidth="0.4" />
        <rect x="30" y="50" width="40" height="12" fill="none" stroke="#d7d2c8" strokeWidth="0.4" />
        {spots.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={3 + Math.min(4, s.n / 6)} fill="#e2b657" fillOpacity="0.85" />
            <text x={s.x} y={s.y + 1} textAnchor="middle" fontSize="2.4" fill="#111">{s.n}</text>
          </g>
        ))}
      </svg>
      <div className="text-[11px] text-muted mt-1">{spots.map((s) => `${s.tag} ${s.n}`).join(" · ") || "No charted landing area for this name."}</div>
    </div>
  );
}

function SideCard({ name, side, tag }: { name: string; side: Side; tag: string }) {
  if (!side) return <div className="bg-white/5 rounded-lg p-2">{name}: no chart</div>;
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="font-medium">{name} defense</div>
      <div className="font-mono">{side.zonePct}% zone · {side.manPct}% man</div>
      <div className="text-muted">{tag} · {side.snaps} charted snaps</div>
    </div>
  );
}
