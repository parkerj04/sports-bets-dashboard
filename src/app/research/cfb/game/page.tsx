"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CfbGame } from "@/lib/cfb";
import type { CfbLab } from "@/lib/cfb-lab";
import { footballRegistry } from "@/lib/football-desk";
import { scoreTone } from "@/lib/score-color";
import { AgentDesk } from "@/components/AgentDesk";
import { FactLine, useDeskFacts } from "@/components/DeskFacts";

type Catcher = { name: string; team: string; rec: number; yards: number; td: number };

function Inner() {
  const id = useSearchParams().get("id");
  const [game, setGame] = useState<CfbGame | null>(null);
  const [lab, setLab] = useState<CfbLab | null>(null);
  const [error, setError] = useState("");
  const [side, setSide] = useState("");
  const [picked, setPicked] = useState("");
  const [catchers, setCatchers] = useState<Catcher[]>([]);
  const [recSource, setRecSource] = useState("");
  useEffect(() => {
    if (!id) { setError("Missing game"); return; }
    fetch(`/api/research/cfb/game?id=${id}`).then((r) => r.json()).then((d) => {
      if (d.error) setError(d.error); else { setGame(d.game); setLab(d.lab); setSide(d.game?.away || ""); }
    });
    fetch(`/api/research/cfb/receivers?id=${id}`).then((r) => r.json()).then((d) => {
      setCatchers(d.players || []);
      setRecSource(d.source || "");
    }).catch(() => setCatchers([]));
  }, [id]);
  const facts = useDeskFacts(game ? { sport: "cfb", away: game.away, home: game.home, awayAbbr: game.awayAbbr, homeAbbr: game.homeAbbr } : null);
  if (error) return <p className="text-danger text-center py-16">{error}</p>;
  if (!game) return <p className="text-muted text-center py-16">Loading college lab…</p>;
  const yards = lab?.stats.find((s) => /total yards/i.test(s.label));
  const desk = footballRegistry({
    away: game.away, home: game.home, awayRecord: game.awayRecord, homeRecord: game.homeRecord,
    mlAway: game.mlAway, mlHome: game.mlHome, awayQb: game.awayQb, homeQb: game.homeQb,
    awayQbLine: game.awayQbLine, homeQbLine: game.homeQbLine, awayYards: yards?.away, homeYards: yards?.home,
    predAway: lab?.predAway, predHome: lab?.predHome,
  });
  const list = catchers.filter((l) => l.team === side);
  const active = list.find((l) => l.name === picked) || list[0];
  return (
    <div className="game space-y-6">
      <div>
        <Link href="/research" className="text-xs text-muted">← CFB slate</Link>
        <h1 className="mt-2 text-2xl tracking-tight">{game.away} <span className="text-muted">@</span> {game.home}</h1>
        <p className="text-sm text-muted">{game.awayConf} vs {game.homeConf}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="card py-3"><div className="text-muted">Spread</div><div className="font-mono font-semibold">{game.spread}</div></div>
        <div className="card py-3"><div className="text-muted">Total</div><div className="font-mono font-semibold">{game.total}</div></div>
        <div className="card py-3"><div className="text-muted">ML</div><div className="font-mono font-semibold">{game.mlAway}/{game.mlHome}</div></div>
      </div>
      <FactLine text={facts?.open} />
      <section className="card space-y-3 p-4">
        <h2 className="text-sm">Receivers</h2>
        <p className="text-xs text-muted">{recSource || "Loading 2026 receptions…"}</p>
        <div className="flex gap-2">
          {[game.away, game.home].map((t) => (
            <button key={t} type="button" onClick={() => { setSide(t); setPicked(""); }} className={`min-h-11 rounded-full px-3 text-sm ${side === t ? "bg-accent text-foreground" : "bg-background text-muted"}`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((p) => (
            <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${active?.name === p.name ? "bg-accent text-foreground" : "bg-background text-muted"}`}>{p.name}</button>
          ))}
        </div>
        {active && <p className="font-mono text-sm">{active.name} · {active.rec} rec · {active.yards} yards · {active.td} TD</p>}
        {list.length === 0 && <p className="text-sm text-muted">No 2026 receptions in the player box for {side}.</p>}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Qb team={game.away} conf={game.awayConf} record={game.awayRecord} name={game.awayQb} line={game.awayQbLine} />
        <Qb team={game.home} conf={game.homeConf} record={game.homeRecord} name={game.homeQb} line={game.homeQbLine} />
      </div>
      <div className="card space-y-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted">QB read</div>
        <div className="flex items-start justify-between gap-3">
          <div className="font-semibold">{desk.pick}</div>
          <div className={`font-mono text-2xl font-semibold ${scoreTone(desk.score)}`}>{desk.score}</div>
        </div>
        <p className="text-sm text-muted">{desk.why}</p>
        <FactLine text={facts?.situation} />
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
      <h2 className="pt-2 text-sm">Picks</h2>
      <AgentDesk away={game.away} home={game.home} />
    </div>
  );
}
function Qb({ team, conf, record, name, line }: { team: string; conf: string; record: string; name: string; line: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{team} · {conf} · {record}</div>
      <div className="text-xl tracking-tight">{name}</div>
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
