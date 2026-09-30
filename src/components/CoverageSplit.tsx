"use client";

import { useEffect, useState } from "react";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Player = { name: string; team: string; tgt: number; zoneTgt: number; manTgt: number; zonePct: number; compPct: number };

export function CoverageSplit({ away, home }: { away: string; home: string }) {
  const [data, setData] = useState<{ source: string; away: Side; home: Side; players: Player[] } | null>(null);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [away, home]);
  if (!data) return null;
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Coverage splits</h3>
      <p className="text-[11px] text-muted">{data.source}. Not live during the game. Sample is charted snaps, not every play.</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideCard name={away} side={data.away} tag={heavy(data.away)} />
        <SideCard name={home} side={data.home} tag={heavy(data.home)} />
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
              <tr key={p.team + p.name} className="border-t border-card-border font-mono">
                <td className="py-1.5 font-sans">{p.name} <span className="text-muted">{p.team}</span></td>
                <td>{p.tgt}</td><td>{p.zoneTgt}</td><td>{p.manTgt}</td><td>{p.zonePct}</td><td>{p.compPct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted">Lean: a pass-catcher whose zone% is high into a zone-heavy defense is the receiving-prop spot. A man-heavy target into a zone defense is a fade. Under 20 targets is noise.</p>
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
