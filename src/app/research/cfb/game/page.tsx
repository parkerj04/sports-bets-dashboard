"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CfbGame } from "@/lib/cfb";
import type { CfbLab } from "@/lib/cfb-lab";
import { footballRegistry } from "@/lib/football-desk";
import { scoreTone } from "@/lib/score-color";
import { AgentDesk } from "@/components/AgentDesk";

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
  const plus = [...list].sort((a, b) => b.yards - a.yards)[0];
  const star = [...list].sort((a, b) => b.td - a.td || b.yards - a.yards)[0];
  const active = list.find((l) => l.name === picked) || list[0];
  return (
    <div className="space-y-4">
      <Link href="/research" className="text-xs text-muted">← CFB slate</Link>
      <h1 className="text-2xl font-bold">{game.away} <span className="text-muted">@</span> {game.home}</h1>
      <p className="text-sm text-muted">{game.awayConf} vs {game.homeConf} · {game.spread} · O/U {game.total} · ML {game.mlAway}/{game.mlHome}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Qb team={game.away} conf={game.awayConf} record={game.awayRecord} name={game.awayQb} line={game.awayQbLine} />
        <Qb team={game.home} conf={game.homeConf} record={game.homeRecord} name={game.homeQb} line={game.homeQbLine} />
      </div>
      <section className="card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Pick a receiver</h3>
        <p className="text-[11px] text-muted">+ is the season receiving-yards leader. ★ is the score lean, most receiving touchdowns. No catch chart, so this is not a coverage matchup.</p>
        <p className="text-[11px] text-muted">{recSource || "Loading 2026 receptions…"}</p>
        {plus && <p className="text-xs">+ {plus.name}. {plus.yards} receiving yards, {plus.rec} catches.</p>}
        {star && <p className="text-xs">★ {star.name} is the score lean, {star.td} receiving TD.</p>}
        <div className="flex gap-2">
          {[game.away, game.home].map((t) => (
            <button key={t} type="button" onClick={() => { setSide(t); setPicked(""); }} className={`text-xs px-3 py-1.5 rounded-full border ${side === t ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`text-xs px-2.5 py-1.5 rounded-lg border ${active?.name === p.name ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}>
              {p.name === plus?.name ? "+ " : ""}{p.name === star?.name ? "★ " : ""}{p.name} {p.rec}
            </button>
          ))}
        </div>
        {active && <div className="text-sm"><div className="font-semibold">{active.name === plus?.name ? "+ " : ""}{active.name === star?.name ? "★ " : ""}{active.name}</div><div className="font-mono text-xs">{active.rec} rec · {active.yards} yards · {active.td} TD</div></div>}
        {list.length === 0 && <p className="text-xs text-muted">No 2026 receptions in the player box for {side}.</p>}
      </section>
      <div className="card p-4">
        <div className="text-xs text-muted uppercase">QB read</div>
        <div className="flex justify-between gap-3">
          <div className="font-semibold">{desk.pick}</div>
          <div className={`text-2xl font-mono font-bold ${scoreTone(desk.score)}`}>{desk.score}</div>
        </div>
        <p className="text-sm mt-2">{desk.why}</p>
        <p className="text-xs text-muted mt-2">Season line is context. It is not the play.</p>
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
      <h2 className="text-sm font-semibold pt-4">Picks</h2>
      <AgentDesk away={game.away} home={game.home} />
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
