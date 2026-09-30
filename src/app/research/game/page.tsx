"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BatterLine, Edge, GameMatchup, PitcherStats, TeamKStats } from "@/lib/mlb";

function scoreColor(score: number) {
  if (score >= 75) return "text-accent";
  if (score >= 60) return "text-warning";
  return "text-muted";
}

function PitcherCard({ p, label }: { p: PitcherStats | null; label: string }) {
  if (!p) {
    return (
      <div className="card p-4">
        <div className="text-xs text-muted">{label}</div>
        <div className="font-semibold mt-1">TBD</div>
      </div>
    );
  }
  return (
    <div className="card p-4 space-y-3">
      <div>
        <div className="text-xs text-muted">{label} · {p.hand}HP</div>
        <h3 className="font-semibold text-lg">{p.name}</h3>
        <p className="text-xs text-muted">{p.wins}-{p.losses} · {p.gamesStarted} GS · {p.inningsPitched} IP</p>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[["ERA", p.era], ["WHIP", p.whip], ["K/9", p.k9], ["HR/9", p.hr9]].map(([k, v]) => (
          <div key={String(k)} className="bg-white/5 rounded-lg py-2">
            <div className="text-[10px] text-muted uppercase">{k}</div>
            <div className="font-mono text-sm font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs text-muted uppercase tracking-wide mb-2">Pitch mix</div>
        {p.arsenal.length === 0 && <p className="text-xs text-muted">No arsenal data yet.</p>}
        <div className="space-y-2">
          {p.arsenal.map((a) => (
            <div key={a.code + a.name}>
              <div className="flex justify-between text-xs mb-0.5">
                <span>{a.name}</span>
                <span className="font-mono text-muted">{a.pct}% · {a.avgVelo} mph</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, a.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BatterTable({ title, rows }: { title: string; rows: BatterLine[] }) {
  return (
    <div className="card p-4 overflow-x-auto">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <table className="w-full text-xs">
        <thead className="text-muted">
          <tr className="text-left">
            <th className="pb-2 font-medium">Batter</th>
            <th className="pb-2 font-medium">AVG</th>
            <th className="pb-2 font-medium">OPS</th>
            <th className="pb-2 font-medium">H</th>
            <th className="pb-2 font-medium">HR</th>
            <th className="pb-2 font-medium">SO</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-t border-card-border">
              <td className="py-1.5 pr-2 font-medium">{b.name}</td>
              <td className="font-mono">{b.avg}</td>
              <td className="font-mono">{b.ops}</td>
              <td className="font-mono">{b.hits}</td>
              <td className="font-mono">{b.hr}</td>
              <td className="font-mono">{b.so}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [data, setData] = useState<{
    game: GameMatchup;
    homePitcher: PitcherStats | null;
    awayPitcher: PitcherStats | null;
    homeHitters: BatterLine[];
    awayHitters: BatterLine[];
    homeTeam: TeamKStats | null;
    awayTeam: TeamKStats | null;
    edges: Edge[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setError("Missing game"); setLoading(false); return; }
    fetch(`/api/research/game?gamePk=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Could not load game"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted text-center py-16">Loading game lab…</p>;
  if (error || !data) return <p className="text-danger text-center py-16">{error || "Not found"}</p>;
  const { game } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/research" className="text-xs text-muted hover:text-accent">← Back to slate</Link>
        <h1 className="text-2xl font-bold mt-2">{game.awayTeam} <span className="text-muted">@</span> {game.homeTeam}</h1>
        <p className="text-sm text-muted">{game.status}{game.venue ? ` · ${game.venue}` : ""}</p>
      </div>
      <section className="grid sm:grid-cols-2 gap-3">
        <PitcherCard p={data.awayPitcher} label="Away starter" />
        <PitcherCard p={data.homePitcher} label="Home starter" />
      </section>
      {(data.awayTeam || data.homeTeam) && (
        <div className="grid grid-cols-2 gap-3 text-center">
          {[data.awayTeam, data.homeTeam].filter(Boolean).map((t) => (
            <div key={t!.teamId} className="card p-3">
              <div className="text-xs text-muted truncate">{t!.name}</div>
              <div className="font-mono text-lg font-bold">{t!.kPct}% K</div>
              <div className="text-xs text-muted">{t!.avg} AVG · {t!.ops} OPS</div>
            </div>
          ))}
        </div>
      )}
      <section>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Plays for this game</h2>
        <div className="space-y-3">
          {data.edges.map((e, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="text-xs text-muted uppercase">{e.market}</div>
                  <div className="font-semibold">{e.pick}</div>
                </div>
                <div className={`text-2xl font-bold font-mono ${scoreColor(e.edgeScore)}`}>{e.edgeScore}</div>
              </div>
              <p className="text-sm">{e.reasoning}</p>
            </div>
          ))}
        </div>
      </section>
      <BatterTable title={`${game.awayTeam} hitters`} rows={data.awayHitters} />
      <BatterTable title={`${game.homeTeam} hitters`} rows={data.homeHitters} />
    </div>
  );
}

export default function GamePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/research" className="flex items-center gap-2 text-sm"><span>🎯</span><span className="font-semibold">Game lab</span></Link>
          <Link href="/picks" className="text-sm text-muted hover:text-accent">Picks</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={<p className="text-muted text-center py-16">Loading…</p>}>
          <GameInner />
        </Suspense>
      </main>
    </div>
  );
}
