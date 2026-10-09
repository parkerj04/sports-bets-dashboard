"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CfbGame } from "@/lib/cfb";
import type { CfbLab } from "@/lib/cfb-lab";
import { toSheet } from "@/lib/cfb-glance";
import { footballRegistry } from "@/lib/football-desk";
import { scoreTone } from "@/lib/score-color";
import { AgentDesk } from "@/components/AgentDesk";
import { FactLine, useDeskFacts } from "@/components/DeskFacts";
import { GameHead } from "@/components/ModelCall";
import { SeasonSheet } from "@/components/PlayCard";
import { SimHundred } from "@/components/SimHundred";

type Catcher = { name: string; team: string; rec: number; yards: number; td: number };

function Inner() {
  const id = useSearchParams().get("id") || "";
  const [game, setGame] = useState<CfbGame | null>(null);
  const [lab, setLab] = useState<CfbLab | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState("");
  const [picked, setPicked] = useState("");
  const [catchers, setCatchers] = useState<Catcher[]>([]);
  const [recSource, setRecSource] = useState("");

  useEffect(() => {
    if (!id) { setError("Missing game"); setLoading(false); return; }
    fetch(`/api/research/cfb/game?id=${id}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d?.game || !d?.lab) setError(d?.error || "Could not load this game");
        else { setGame(d.game); setLab(d.lab); setSide(d.game.away || ""); }
      })
      .catch(() => setError("Could not load this game"))
      .finally(() => setLoading(false));
    fetch(`/api/research/cfb/receivers?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCatchers(d.players || []);
        setRecSource(d.source || "");
      })
      .catch(() => setCatchers([]));
  }, [id]);

  const facts = useDeskFacts(game ? { sport: "cfb", away: game.away, home: game.home, awayAbbr: game.awayAbbr, homeAbbr: game.homeAbbr } : null);

  if (loading) return <p className="text-muted text-center py-16">Loading college lab...</p>;
  if (error || !game || !lab) return <p className="text-danger text-center py-16">{error || "Not found"}</p>;

  const injuries = lab.injuries || [];
  const lastFive = lab.lastFive || [];
  const stats = lab.stats || [];
  const awayInj = injuries.filter((i) => i.team === game.away);
  const homeInj = injuries.filter((i) => i.team === game.home);
  const out = (rows: typeof awayInj) => rows.filter((r) => /out|doubt/i.test(r.status)).map((r) => `${r.name} ${r.status}`);
  const yards = stats.find((s) => /total yards/i.test(s.label));
  const desk = footballRegistry({
    away: game.away,
    home: game.home,
    awayRecord: game.awayRecord,
    homeRecord: game.homeRecord,
    mlAway: game.mlAway,
    mlHome: game.mlHome,
    awayQb: game.awayQb,
    homeQb: game.homeQb,
    awayQbLine: game.awayQbLine,
    homeQbLine: game.homeQbLine,
    awayOuts: out(awayInj),
    homeOuts: out(homeInj),
    awayL5: lastFive.filter((g) => g.team === game.away).map((g) => g.result),
    homeL5: lastFive.filter((g) => g.team === game.home).map((g) => g.result),
    awayYards: yards?.away,
    homeYards: yards?.home,
    predAway: lab.predAway,
    predHome: lab.predHome,
  });
  const list = catchers.filter((l) => l.team === side);
  const active = list.find((l) => l.name === picked) || list[0];
  const sheet = toSheet(game);

  return (
    <div className="game space-y-6" style={{ background: "#0e0e0c", color: "#f0eee6" }}>
      <Link href="/research" className="text-xs text-muted">← Slate</Link>
      <GameHead
        away={game.away}
        home={game.home}
        posted={String(game.spread || "NL")}
        total={game.total ?? ""}
        forecast={null}
        sport="CFB"
      />
      {sheet ? (
        <div className="card p-4">
          <SeasonSheet sheet={sheet} />
        </div>
      ) : null}
      <FactLine text={facts?.open} />
      <AgentDesk away={game.away} home={game.home} />
      <section className="space-y-3 border p-3" style={{ borderColor: "#2c2c28" }}>
        <h2 className="text-sm font-medium">Receivers</h2>
        <p className="text-xs text-muted">{recSource || "Season receptions. Not a catch chart."}</p>
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
      <div className="card overflow-x-auto p-4">
        <h3 className="mb-2 text-sm font-semibold">Season</h3>
        <table className="w-full text-xs">
          <thead className="text-muted"><tr><th className="pb-2 text-left">Stat</th><th>{game.awayAbbr}</th><th>{game.homeAbbr}</th></tr></thead>
          <tbody>
            {stats.slice(0, 8).map((s) => (
              <tr key={s.label} className="border-t border-card-border font-mono">
                <td className="py-1.5 pr-2 font-sans">{s.label}</td><td>{s.away}</td><td>{s.home}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Inj title={`${game.away} injuries`} rows={awayInj.slice(0, 6)} />
        <Inj title={`${game.home} injuries`} rows={homeInj.slice(0, 6)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Qb team={game.away} conf={game.awayConf} record={game.awayRecord} name={game.awayQb} line={game.awayQbLine} />
        <Qb team={game.home} conf={game.homeConf} record={game.homeRecord} name={game.homeQb} line={game.homeQbLine} />
      </div>
      {lastFive.length > 0 && (
        <div className="card p-4 text-xs">
          <h3 className="mb-2 text-sm font-semibold">Last 5</h3>
          {lastFive.map((g, i) => (
            <div key={i} className="border-t border-card-border py-1 font-mono">{g.team} {g.result} {g.score} {g.opp}</div>
          ))}
        </div>
      )}
      {lab.leaders.length > 0 && (
        <div className="card p-4 text-xs">
          <h3 className="mb-2 text-sm font-semibold">Leaders</h3>
          {lab.leaders.map((l, i) => (
            <div key={i} className="flex justify-between gap-2 border-t border-card-border py-1.5">
              <span>{l.team} · {l.category}</span>
              <span className="font-mono">{l.name} {l.value}</span>
            </div>
          ))}
        </div>
      )}
      <SimHundred
        sport="CFB"
        away={game.away}
        home={game.home}
        awayTag={game.awayAbbr || "AWY"}
        homeTag={game.homeAbbr || "HOME"}
        spread={String(game.spread || "")}
        total={game.total ?? ""}
        seed={id || `${game.away}-${game.home}`}
      />
      <section className="space-y-3 border p-3 text-sm" style={{ borderColor: "#2c2c28" }}>
        <h2 className="text-sm font-medium">Picks</h2>
        <div className="flex items-start justify-between gap-3">
          <div>{desk.pick}</div>
          <div className={`font-mono ${scoreTone(desk.score)}`}>{desk.score}</div>
        </div>
        <p className="text-muted">{desk.why}</p>
        <div>
          <div className="text-good">The case for</div>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
            {(desk.aligns.length ? desk.aligns : ["Nothing in the registry is stacked."]).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-danger">The case against</div>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
            {(desk.misses.length ? desk.misses : ["No miss is named."]).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <FactLine text={facts?.situation} />
        {lab.predHome ? <p>ESPN predictor: {game.away} {lab.predAway}% · {game.home} {lab.predHome}%</p> : null}
      </section>
      <p className="text-xs text-muted">No catch chart for college. The NFL field uses the 2026 play-by-play file. This game has season receptions only.</p>
    </div>
  );
}

function Inj({ title, rows }: { title: string; rows: { name: string; status: string; desc: string }[] }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      {rows.length === 0 && <p className="text-xs text-muted">No report in this feed.</p>}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name + r.status} className="text-xs">
            <div className="font-medium">{r.name} <span className="text-muted">{r.status}</span></div>
            {r.desc && <p className="text-muted">{r.desc}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Qb({ team, conf, record, name, line }: { team: string; conf: string; record: string; name: string; line: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{team} · {conf} · {record}</div>
      <div className="text-xl tracking-tight">{name}</div>
      <div className="mt-2 font-mono text-sm">{line}</div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between">
          <Link href="/research" className="text-sm font-semibold">CFB lab</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={<p className="text-muted text-center py-16">Loading...</p>}>
          <Inner />
        </Suspense>
      </main>
    </div>
  );
}
