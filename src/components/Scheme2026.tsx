"use client";
import { useEffect, useState } from "react";

type Side = { plays: number; passRate: number; epaPlay: number; passEpa: number; rushEpa: number; motion: number; playAction: number; rpo: number; screen: number; blitz: number; box8: number } | null;

export function Scheme2026({ away, home }: { away: string; home: string }) {
  const [data, setData] = useState<{ source: string; away: Side; home: Side } | null>(null);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/scheme?away=${away}&home=${home}`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, [away, home]);
  if (!data) return null;
  return (
    <div className="card p-4 space-y-2">
      <h3 className="font-semibold text-sm">2026 scheme, weeks 1–3</h3>
      <p className="text-[11px] text-muted">{data.source}</p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <Block name={away} s={data.away} />
        <Block name={home} s={data.home} />
      </div>
      <p className="text-[11px] text-muted">Read it as offense tendency vs what the other defense has shown. A motion-heavy offense into a low-blitz defense is a different game than a play-action team into a 25% blitz. EPA/play is the quality number. Blitz% is charted extra rushers, so it runs lower than TV “blitz rate.”</p>
    </div>
  );
}

function Block({ name, s }: { name: string; s: Side }) {
  if (!s) return <div className="bg-white/5 rounded-lg p-2">{name}: no 2026 file</div>;
  return (
    <div className="bg-white/5 rounded-lg p-2 space-y-1 font-mono">
      <div className="font-sans font-medium">{name}</div>
      <div>EPA/play {s.epaPlay} · pass {s.passEpa} · rush {s.rushEpa}</div>
      <div>Pass rate {s.passRate}% · motion {s.motion}%</div>
      <div>PA {s.playAction}% · RPO {s.rpo}% · screen {s.screen}%</div>
      <div>Blitz faced/sent {s.blitz}% · 8+ box {s.box8}%</div>
    </div>
  );
}
