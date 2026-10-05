"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameMatchup } from "@/lib/mlb";
import type { MlbLine } from "@/lib/mlb-odds";
import type { NflGame } from "@/lib/nfl";
import { BrandMark } from "@/components/Logo";
import { PropBoards } from "@/components/PropBoards";
import { CfbBoard } from "@/components/CfbBoard";
import { SportPicks } from "@/components/SportPicks";
import { SlipTray } from "@/components/SlipTray";
import { TrendBoard } from "@/components/TrendBoard";
import { ModelCall } from "@/components/ModelCall";
import { scoreTone } from "@/lib/score-color";

type Sport = "MLB" | "NFL" | "CFB";
type SlateGame = GameMatchup & { line?: MlbLine | null };
type ResultNote = { id: string; game: string; scoreline: string; cards: string[] };

export default function ResearchPage() {
  const [sport, setSport] = useState<Sport>("MLB");
  const [games, setGames] = useState<SlateGame[]>([]);
  const [mlbResults, setMlbResults] = useState<ResultNote[]>([]);
  const [mlbNote, setMlbNote] = useState("");
  const [nfl, setNfl] = useState<{ week: number; games: NflGame[]; results?: ResultNote[]; checked?: string }>({ week: 0, games: [], results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sport === "CFB") { setLoading(false); return; }
    setLoading(true);
    const url = sport === "NFL" ? "/api/research/nfl" : "/api/research?slate=1";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (sport === "NFL") setNfl({ week: data.week || 0, games: data.games || [], results: data.results || [], checked: data.checked });
        else {
          setGames(data.games || []);
          setMlbResults(data.results || []);
          setMlbNote(data.note || "");
        }
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Could not load research"))
      .finally(() => setLoading(false));
  }, [sport]);

  return (
    <div className="min-h-screen pb-28">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard"><BrandMark /></Link>
          <Link href="/research/desk" className="text-sm text-accent hover:underline">Desk review</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="flex gap-2">
          {(["MLB", "NFL", "CFB"] as const).map((s) => (
            <button key={s} onClick={() => setSport(s)} className={`px-4 py-1.5 rounded-full text-sm border ${sport === s ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{s}</button>
          ))}
        </div>
        <p className="text-xs text-muted">Scoreboards checked 2:11 AM ET, Saturday Oct 3. Finals are off the slate. The model score is the posted number split, not a private model.</p>
        {sport === "CFB" && (<><CfbBoard /><SportPicks sport="CFB" /></>)}
        {sport === "NFL" && (
          <>
            <section className="space-y-3">
              <h1 className="text-xl font-bold">NFL Week {nfl.week || "—"}</h1>
              <p className="text-sm text-muted">Tap a game for researched plays. Finals are off this slate. {nfl.checked}</p>
              {loading && <p className="text-muted text-sm">Loading NFL…</p>}
              {(nfl.results || []).length > 0 && (
                <div className="card p-4 space-y-2">
                  <h2 className="font-semibold text-sm">Results</h2>
                  {(nfl.results || []).map((r) => (
                    <div key={r.id} className="text-sm border-t border-card-border pt-2">
                      <div className="font-medium">{r.scoreline}</div>
                      {r.cards.map((c) => <p key={c} className="text-xs text-muted mt-1">{c}</p>)}
                    </div>
                  ))}
                </div>
              )}
              {nfl.games.map((g) => (
                <Link key={g.id} href={`/research/nfl/game?id=${g.id}`} className="card p-4 space-y-2 block hover:border-accent/40">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-semibold">{g.away} ({g.awayRecord})</div>
                      <div className="text-sm text-muted">at {g.home} ({g.homeRecord})</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-mono font-bold ${scoreTone(g.leanScore || 0)}`}>{g.leanScore || "—"}</div>
                      <div className="text-[10px] text-accent">Open game →</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Spread</div><div className="font-mono">{g.spread}</div></div>
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Total</div><div className="font-mono">{g.total}</div></div>
                    <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">ML</div><div className="font-mono">{g.mlAway}/{g.mlHome}</div></div>
                  </div>
                  <ModelCall away={g.away} home={g.home} spread={g.spread} total={g.total} />
                  <div className="text-sm"><span className="text-accent font-medium">{g.leanML}</span>{" · "}<span className="text-accent font-medium">Total: {g.leanTotal}</span></div>
                  <p className="text-xs text-muted">{g.leanWhy}</p>
                </Link>
              ))}
            </section>
            <TrendBoard />
            <SportPicks sport="NFL" />
          </>
        )}
        {sport === "MLB" && (
          <section className="space-y-3">
            <h1 className="text-xl font-bold">MLB slate</h1>
            <p className="text-sm text-muted">Tap a game for the lab. Finals are off the slate. The model score is a run score from the posted total.</p>
            {loading && <p className="text-muted text-sm">Loading slate…</p>}
            {error && !loading && <p className="text-danger text-sm">{error}</p>}
            <div className="card p-4 space-y-2">
              <h2 className="font-semibold text-sm">Results</h2>
              <p className="text-xs text-muted">{mlbNote || "Checking ESPN…"}</p>
              {mlbResults.map((r) => (
                <div key={r.id} className="text-sm border-t border-card-border pt-2">
                  <div className="font-medium">{r.scoreline}</div>
                  {r.cards.map((c) => <p key={c} className="text-xs text-muted mt-1">{c}</p>)}
                </div>
              ))}
            </div>
            {games.map((g) => (
              <Link key={g.gamePk} href={`/research/game?id=${g.gamePk}`} className="card p-4 space-y-2 block hover:border-accent/40">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{g.awayTeam}</div>
                    <div className="text-sm text-muted">at {g.homeTeam}</div>
                    <div className="text-[11px] text-muted mt-1">{g.status}{g.venue ? ` · ${g.venue}` : ""}</div>
                  </div>
                  <div className="text-right text-[10px] text-accent">Open game →</div>
                </div>
                <div className="text-sm"><span className="text-muted">SP</span> {g.awayPitcher || "TBD"} <span className="text-muted">vs</span> {g.homePitcher || "TBD"}</div>
                {g.line && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Spread</div><div className="font-mono">{g.line.spread}</div></div>
                      <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">Total</div><div className="font-mono">{g.line.total}</div></div>
                      <div className="bg-white/5 rounded-lg py-2"><div className="text-muted">ML</div><div className="font-mono">{g.line.mlAway}/{g.line.mlHome}</div></div>
                    </div>
                    <ModelCall away={g.awayTeam} home={g.homeTeam} spread={g.line.spread} total={g.line.total} sport="MLB" />
                  </>
                )}
              </Link>
            ))}
            <PropBoards sport="MLB" />
          </section>
        )}
      </main>
      <SlipTray />
    </div>
  );
}
