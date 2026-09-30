"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CfbGame } from "@/lib/cfb";
import type { CfbLab } from "@/lib/cfb-lab";

function Inner() {
  const id = useSearchParams().get("id");
  const [game, setGame] = useState<CfbGame | null>(null);
  const [lab, setLab] = useState<CfbLab | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) { setError("Missing game"); return; }
    fetch(`/api/research/cfb/game?id=${id}`).then((r) => r.json()).then((d) => {
      if (d.error) setError(d.error); else { setGame(d.game); setLab(d.lab); }
    });
  }, [id]);
  if (error) return <p className="text-danger text-center py-16">{error}</p>;
  if (!game) return <p className="text-muted text-center py-16">Loading college lab…</p>;
  return (
    <div className="space-y-4">
      <Link href="/research" className="text-xs text-muted">← CFB slate</Link>
      <h1 className="text-2xl font-bold">{game.away} <span className="text-muted">@</span> {game.home}</h1>
      <p className="text-sm text-muted">{game.awayConf} vs {game.homeConf} · {game.spread} · O/U {game.total} · ML {game.mlAway}/{game.mlHome}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Qb team={game.away} conf={game.awayConf} record={game.awayRecord} name={game.awayQb} line={game.awayQbLine} />
        <Qb team={game.home} conf={game.homeConf} record={game.homeRecord} name={game.homeQb} line={game.homeQbLine} />
      </div>
      <div className="card p-4">
        <div className="text-xs text-muted uppercase">QB lean</div>
        <div className="font-semibold text-accent">{game.lean}</div>
        <p className="text-sm text-muted mt-2">{game.why}</p>
      </div>
      {lab?.predHome && <div className="card p-4 text-sm">ESPN predictor: {game.away} {lab.predAway}% · {game.home} {lab.predHome}%</div>}
      {lab && lab.stats.length > 0 && (
        <div className="card p-4 overflow-x-auto">
          <h3 className="font-semibold text-sm mb-2">Offense and defense</h3>
          <table className="w-full text-xs">
            <thead className="text-muted"><tr><th className="text-left pb-2">Stat</th><th>{game.awayAbbr}</th><th>{game.homeAbbr}</th></tr></thead>
            <tbody>
              {lab.stats.map((s) => (
                <tr key={s.label} className="border-t border-card-border font-mono">
                  <td className="py-1.5 pr-2 font-sans">{s.label}</td><td>{s.away}</td><td>{s.home}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {lab && lab.leaders.length > 0 && (
        <div className="card p-4 text-xs">
          <h3 className="font-semibold text-sm mb-2">Leaders</h3>
          {lab.leaders.map((l, i) => (
            <div key={i} className="flex justify-between gap-2 border-t border-card-border py-1.5">
              <span>{l.team} · {l.category}</span>
              <span className="font-mono">{l.name} {l.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Qb({ team, conf, record, name, line }: { team: string; conf: string; record: string; name: string; line: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{team} · {conf} · {record}</div>
      <div className="text-xl font-bold mt-1">{name}</div>
      <div className="font-mono text-sm mt-2">{line}</div>
    </div>
  );
}
export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border"><div className="max-w-4xl mx-auto px-4 py-3 text-sm font-semibold">CFB lab</div></header>
      <main className="max-w-4xl mx-auto px-4 py-6"><Suspense><Inner /></Suspense></main>
    </div>
  );
}
