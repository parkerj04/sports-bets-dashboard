"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CfbGame } from "@/lib/cfb";

function Inner() {
  const id = useSearchParams().get("id");
  const [game, setGame] = useState<CfbGame | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) { setError("Missing game"); return; }
    fetch(`/api/research/cfb/game?id=${id}`).then((r) => r.json()).then((d) => d.error ? setError(d.error) : setGame(d.game));
  }, [id]);
  if (error) return <p className="text-danger text-center py-16">{error}</p>;
  if (!game) return <p className="text-muted text-center py-16">Loading quarterbacks…</p>;
  return (
    <div className="space-y-4">
      <Link href="/research" className="text-xs text-muted">← CFB slate</Link>
      <h1 className="text-2xl font-bold">{game.away} <span className="text-muted">@</span> {game.home}</h1>
      <p className="text-sm text-muted">{game.awayConf} vs {game.homeConf} · {game.spread} · O/U {game.total}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Qb team={game.away} conf={game.awayConf} record={game.awayRecord} name={game.awayQb} line={game.awayQbLine} />
        <Qb team={game.home} conf={game.homeConf} record={game.homeRecord} name={game.homeQb} line={game.homeQbLine} />
      </div>
      <div className="card p-4">
        <div className="text-xs text-muted uppercase">QB lean</div>
        <div className="font-semibold text-accent">{game.lean}</div>
        <p className="text-sm text-muted mt-2">{game.why}</p>
      </div>
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
