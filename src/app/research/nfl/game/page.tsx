"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { NflGame } from "@/lib/nfl";
import type { NflLab } from "@/lib/nfl-game";
import { CoverageSplit } from "@/components/CoverageSplit";
import { PropsDesk } from "@/components/builds/props-desk";
import { footballRegistry } from "@/lib/football-desk";
import { newsFor } from "@/lib/nfl-news";
import { scoreTone } from "@/lib/score-color";
import { FactLine, useDeskFacts } from "@/components/DeskFacts";
import { ModelCall } from "@/components/ModelCall";
import { SimHundred } from "@/components/SimHundred";

function Inner() {
  const id = useSearchParams().get("id") || "";
  const [lab, setLab] = useState<NflLab | null>(null);
  const [card, setCard] = useState<NflGame | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setError("Missing game"); setLoading(false); return; }
    fetch(`/api/research/nfl/game?id=${id}`)
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !d?.lab) setError(d?.error || "Could not load this game");
        else { setLab(d.lab); setCard(d.card || null); }
      })
      .catch(() => setError("Could not load this game"))
      .finally(() => setLoading(false));
  }, [id]);

  const facts = useDeskFacts(lab ? { sport: "nfl", away: lab.away, home: lab.home, awayAbbr: lab.awayAbbr, homeAbbr: lab.homeAbbr } : null);

  if (loading) return <p className="text-muted text-center py-16">Loading NFL lab…</p>;
  if (error || !lab) return <p className="text-danger text-center py-16">{error || "Not found"}</p>;
  const injuries = lab.injuries || [];
  const lastFive = lab.lastFive || [];
  const stats = lab.stats || [];
  const awayInj = injuries.filter((i) => i.team === lab.away);
  const homeInj = injuries.filter((i) => i.team === lab.home);
  const out = (rows: typeof awayInj) => rows.filter((r) => /out|doubt/i.test(r.status)).map((r) => `${r.name} ${r.status}`);
  const yards = stats.find((s) => /total yards/i.test(s.label));
  const notes = newsFor(lab.away, lab.home);
  const desk = footballRegistry({
    away: lab.away,
    home: lab.home,
    awayRecord: card?.awayRecord || "",
    homeRecord: card?.homeRecord || "",
    mlAway: card?.mlAway || lab.mlAway,
    mlHome: card?.mlHome || lab.mlHome,
    awayOuts: out(awayInj),
    homeOuts: out(homeInj),
    awayL5: lastFive.filter((g) => g.team === lab.away).map((g) => g.result),
    homeL5: lastFive.filter((g) => g.team === lab.home).map((g) => g.result),
    awayYards: yards?.away,
    homeYards: yards?.home,
    predAway: lab.predAway,
    predHome: lab.predHome,
  });

  return (
    <div className="game space-y-6">
      <div>
        <Link href="/research" className="text-xs text-muted hover:text-accent">← NFL slate</Link>
        <h1 className="mt-2 text-2xl tracking-tight">{lab.away} <span className="text-muted">@</span> {lab.home}</h1>
        <p className="text-sm text-muted">{lab.status}{lab.venue ? ` · ${lab.venue}` : ""}</p>
      </div>
      <FactLine text={facts?.open} />
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="card py-3"><div className="text-muted">Spread</div><div className="font-mono font-semibold">{String(card?.spread || lab.spread || "NL")}</div></div>
        <div className="card py-3"><div className="text-muted">Total</div><div className="font-mono font-semibold">{String(card?.total ?? lab.total ?? "NL")}</div></div>
        <div className="card py-3"><div className="text-muted">ML</div><div className="font-mono font-semibold">{String(card?.mlAway || lab.mlAway || "—")}/{String(card?.mlHome || lab.mlHome || "—")}</div></div>
      </div>
      <div className="card space-y-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted">Researched side</div>
        <div className="flex items-start justify-between gap-3">
          <div className="font-semibold">{desk.pick}</div>
          <div className={`font-mono text-2xl font-semibold ${scoreTone(desk.score)}`}>{desk.score}</div>
        </div>
        <p className="text-sm text-muted">{desk.why}{notes.length ? ` ${notes.map((n) => n.desk).join(" ")}` : ""}</p>
        <FactLine text={facts?.situation} />
        <ModelCall away={lab.away} home={lab.home} spread={String(card?.spread || lab.spread || "")} total={card?.total ?? lab.total ?? ""} />
      </div>
      <PropsDesk away={lab.awayAbbr} home={lab.homeAbbr} embedded pending={!/final/i.test(lab.status)} />
      <CoverageSplit away={lab.awayAbbr} home={lab.homeAbbr} venue={lab.venue} />
      <div className="card overflow-x-auto p-4">
        <h3 className="mb-2 text-sm font-semibold">Season</h3>
        <table className="w-full text-xs">
          <thead className="text-muted"><tr><th className="pb-2 text-left">Stat</th><th>{lab.awayAbbr}</th><th>{lab.homeAbbr}</th></tr></thead>
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
        <Inj title={`${lab.away} injuries`} rows={awayInj.slice(0, 6)} />
        <Inj title={`${lab.home} injuries`} rows={homeInj.slice(0, 6)} />
      </div>
      {lastFive.length > 0 && (
        <div className="card p-4 text-xs">
          <h3 className="mb-2 text-sm font-semibold">Last 5</h3>
          {lastFive.map((g, i) => (
            <div key={i} className="border-t border-card-border py-1 font-mono">{g.team} {g.result} {g.score} {g.opp}</div>
          ))}
        </div>
      )}
      <SimHundred
        sport="NFL"
        away={lab.away}
        home={lab.home}
        awayTag={lab.awayAbbr}
        homeTag={lab.homeAbbr}
        spread={String(card?.spread || lab.spread || "")}
        total={card?.total ?? lab.total ?? ""}
        seed={id || `${lab.away}-${lab.home}`}
      />
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

export default function NflGamePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between">
          <Link href="/research" className="text-sm font-semibold">NFL lab</Link>
          <Link href="/research/nfl-playbook" className="text-sm text-muted">Checklist</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={<p className="text-muted text-center py-16">Loading…</p>}>
          <Inner />
        </Suspense>
      </main>
    </div>
  );
}
