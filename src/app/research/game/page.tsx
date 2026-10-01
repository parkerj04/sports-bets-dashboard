"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BatterLine, Edge, GameMatchup, PitcherStats, TeamKStats } from "@/lib/mlb";
import type { BvP, PitcherDeep } from "@/lib/propdesk";
import type { HitterLog } from "@/lib/hitter-form";
import type { Ticket } from "@/lib/ticket";
import { HitterForm } from "@/components/HitterForm";
import { BvPPicker } from "@/components/BvPPicker";
import { StealBoard } from "@/components/StealBoard";
import { SlipCheck, SlipTray } from "@/components/SlipTray";
import { TicketDesk } from "@/components/TicketDesk";
import { RosterCheck } from "@/components/RosterCheck";
import { AgentDesk } from "@/components/AgentDesk";
import { scoreTone } from "@/lib/score-color";
import { isPlayable } from "@/lib/edges";

function PitcherCard({ p, label, deep }: { p: PitcherStats | null; label: string; deep?: PitcherDeep | null }) {
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
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-xs text-muted">{label} · {p.hand}HP</div>
          <h3 className="font-semibold text-lg">{p.name}</h3>
          <p className="text-xs text-muted">{p.wins}-{p.losses} · {p.gamesStarted} GS · {p.inningsPitched} IP</p>
        </div>
        {deep && (
          <div className="text-right">
            <div className="text-[10px] text-muted uppercase">LS</div>
            <div className={`text-2xl font-mono font-bold ${scoreTone(deep.lsRating)}`}>{deep.lsRating}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[["ERA", p.era], ["WHIP", p.whip], ["K/9", p.k9], ["HR/9", p.hr9]].map(([k, v]) => (
          <div key={String(k)} className="bg-white/5 rounded-lg py-2">
            <div className="text-[10px] text-muted uppercase">{k}</div>
            <div className="font-mono text-sm font-semibold">{v}</div>
          </div>
        ))}
      </div>
      {deep && (
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-muted">Proj Ks</div>
            <div className="font-mono text-sm font-semibold">{deep.projK}</div>
          </div>
          <div className="bg-white/5 rounded-lg py-2">
            <div className="text-muted">L5 Ks</div>
            <div className="font-mono text-sm font-semibold">{deep.last5K} / {deep.last5IP} IP</div>
          </div>
        </div>
      )}
      {deep && deep.splits.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="text-muted uppercase tracking-wide">vs L / R</div>
          {deep.splits.map((s) => (
            <div key={s.side} className="flex justify-between font-mono">
              <span>{s.side}</span>
              <span>AVG {s.avg} · {s.so} K</span>
            </div>
          ))}
        </div>
      )}
      {deep && deep.last5.length > 0 && (
        <div className="overflow-x-auto">
          <div className="text-[10px] text-muted uppercase mb-1">Last 5 starts</div>
          <table className="w-full text-[11px] font-mono">
            <thead className="text-muted"><tr><th className="text-left">Date</th><th>OPP</th><th>IP</th><th>K</th><th>ER</th></tr></thead>
            <tbody>
              {deep.last5.map((g) => (
                <tr key={g.date + g.opp} className="border-t border-card-border">
                  <td>{g.date.slice(5)}</td><td>{g.opp}</td><td>{g.ip}</td><td>{g.k}</td><td>{g.er}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

function PlayCard({ e, live }: { e: Edge; live: boolean }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-xs text-muted uppercase">{e.market}{live ? "" : " · research only"}</div>
          <div className="font-semibold">{e.pick}</div>
        </div>
        <div className={`text-2xl font-bold font-mono ${scoreTone(e.edgeScore)}`}>{e.edgeScore}</div>
      </div>
      <p className="text-sm">{e.reasoning}</p>
      <SlipCheck item={{
        id: `${e.gamePk}-${e.market}-${e.pick}`,
        sport: "MLB",
        game: e.game,
        market: e.market,
        pick: e.pick,
        score: e.edgeScore,
        why: e.reasoning,
        playable: live,
      }} />
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
    steals?: Edge[];
    ticket?: Ticket;
    homeDeep: PitcherDeep | null;
    awayDeep: PitcherDeep | null;
    bvp: BvP[];
    form: HitterLog[];
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
  const otherPlays = (data.edges || []).filter((e) => e.market !== "Stolen Bases");
  const live = otherPlays.filter(isPlayable);
  const watch = otherPlays.filter((e) => !isPlayable(e));

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link href="/research" className="text-xs text-muted hover:text-accent">← Back to slate</Link>
        <h1 className="text-2xl font-bold mt-2">{game.awayTeam} <span className="text-muted">@</span> {game.homeTeam}</h1>
        <p className="text-sm text-muted">{game.status}{game.venue ? ` · ${game.venue}` : ""}</p>
      </div>
      <AgentDesk away={game.awayTeam} home={game.homeTeam} />
      <RosterCheck sport="mlb" away={game.awayTeam} home={game.homeTeam} awayId={game.awayId} homeId={game.homeId} />
      {data.ticket && <TicketDesk ticket={data.ticket} />}
      <section className="grid sm:grid-cols-2 gap-3">
        <PitcherCard p={data.awayPitcher} label="Away starter" deep={data.awayDeep} />
        <PitcherCard p={data.homePitcher} label="Home starter" deep={data.homeDeep} />
      </section>
      <BvPPicker
        homeHitters={data.homeHitters}
        awayHitters={data.awayHitters}
        homePitcherId={data.homePitcher?.id}
        awayPitcherId={data.awayPitcher?.id}
        homePitcherName={data.homePitcher?.name}
        awayPitcherName={data.awayPitcher?.name}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />
      {data.bvp?.length > 0 && (
        <div className="card p-4 overflow-x-auto">
          <h3 className="font-semibold text-sm mb-2">Batter vs this starter (career)</h3>
          <table className="w-full text-xs">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="pb-2">Batter</th><th>AB</th><th>H</th><th>HR</th><th>SO</th><th>AVG</th><th>OPS</th>
              </tr>
            </thead>
            <tbody>
              {data.bvp.map((r) => (
                <tr key={r.batterId} className="border-t border-card-border font-mono">
                  <td className="py-1.5 pr-2 font-sans font-medium">{r.batter}</td>
                  <td>{r.ab}</td><td>{r.h}</td><td>{r.hr}</td><td>{r.so}</td><td>{r.avg}</td><td>{r.ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <HitterForm rows={data.form || []} />
      <StealBoard edges={data.steals || []} />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-good">Playable</h2>
        {live.map((e, i) => <PlayCard key={`l${i}`} e={e} live />)}
        {!live.length && <p className="text-xs text-muted">Nothing cleared the bar in this game.</p>}
        <h2 className="text-sm font-semibold text-danger pt-2">Research only</h2>
        {watch.map((e, i) => <PlayCard key={`w${i}`} e={e} live={false} />)}
      </section>
      <BatterTable title={`${game.awayTeam} hitters`} rows={data.awayHitters} />
      <BatterTable title={`${game.homeTeam} hitters`} rows={data.homeHitters} />
      <SlipTray />
    </div>
  );
}

export default function GamePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/research" className="text-sm font-semibold">Game lab</Link>
          <div className="flex gap-3">
            <Link href="/research/playbook" className="text-sm text-muted hover:text-accent">Playbook</Link>
            <Link href="/picks" className="text-sm text-muted hover:text-accent">Picks</Link>
          </div>
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
