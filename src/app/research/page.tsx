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
            <button key={s} onClick={() => setSport(s)} className={`min-h-11 flex-1 rounded-full text-sm ${sport === s ? "bg-accent text-[#1a1408]" : "bg-card text-muted"}`}>{s}</button>
          ))}
        </div>
        {sport === "CFB" && (
          <>
            <CfbBoard />
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-semibold">Researched picks</summary>
              <div className="mt-3"><SportPicks sport="CFB" /></div>
            </details>
          </>
        )}
        {sport === "NFL" && (
          <section className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight">NFL Week {nfl.week || "—"}</h1>
            <p className="text-sm text-muted">Tap a game. The writeup is inside.</p>
            {loading && <p className="text-sm text-muted">Loading NFL…</p>}
            {nfl.games.map((g) => (
              <Link key={g.id} href={`/research/nfl/game?id=${g.id}`} className={`card block p-4 ${g.broadcast === "Prime Video" ? "ring-1 ring-accent" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {g.broadcast === "Prime Video" ? <div className="mb-1 text-xs text-accent">Thursday night</div> : null}
                    <div className="font-semibold">{g.away} <span className="font-normal text-muted">{g.awayRecord}</span></div>
                    <div className="text-sm text-muted">at {g.home} {g.homeRecord}</div>
                  </div>
                  <div className="text-right font-mono text-sm">
                    <div>{g.spread}</div>
                    <div className="text-muted">O/U {g.total}</div>
                  </div>
                </div>
                {g.leanML ? <p className="mt-3 truncate text-sm text-accent">{g.leanML}</p> : null}
              </Link>
            ))}
            {(nfl.results || []).length > 0 && (
              <details className="card p-4">
                <summary className="cursor-pointer text-sm font-semibold">Results</summary>
                <div className="mt-3 space-y-2">
                  {(nfl.results || []).map((r) => (
                    <div key={r.id} className="border-t border-card-border pt-2 text-sm">
                      <div className="font-medium">{r.scoreline}</div>
                      {r.cards.map((c) => <p key={c} className="mt-1 text-xs text-muted">{c}</p>)}
                    </div>
                  ))}
                </div>
              </details>
            )}
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-semibold">Trends and picks</summary>
              <div className="mt-4 space-y-6">
                <TrendBoard />
                <SportPicks sport="NFL" />
              </div>
            </details>
          </section>
        )}
        {sport === "MLB" && (
          <section className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight">MLB slate</h1>
            <p className="text-sm text-muted">Tap a game. The lab is inside.</p>
            {loading && <p className="text-sm text-muted">Loading slate…</p>}
            {error && !loading && <p className="text-sm text-danger">{error}</p>}
            {games.map((g) => (
              <Link key={g.gamePk} href={`/research/game?id=${g.gamePk}`} className="card block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{g.awayTeam}</div>
                    <div className="text-sm text-muted">at {g.homeTeam}</div>
                    <div className="mt-2 truncate text-sm">{g.awayPitcher || "TBD"} <span className="text-muted">vs</span> {g.homePitcher || "TBD"}</div>
                  </div>
                  {g.line ? (
                    <div className="text-right font-mono text-sm">
                      <div>{g.line.spread}</div>
                      <div className="text-muted">O/U {g.line.total}</div>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
            {mlbResults.length > 0 && (
              <details className="card p-4">
                <summary className="cursor-pointer text-sm font-semibold">Results</summary>
                <p className="mt-2 text-xs text-muted">{mlbNote}</p>
                <div className="mt-3 space-y-2">
                  {mlbResults.map((r) => (
                    <div key={r.id} className="border-t border-card-border pt-2 text-sm">
                      <div className="font-medium">{r.scoreline}</div>
                      {r.cards.map((c) => <p key={c} className="mt-1 text-xs text-muted">{c}</p>)}
                    </div>
                  ))}
                </div>
              </details>
            )}
            <details className="card p-4">
              <summary className="cursor-pointer text-sm font-semibold">Home run board</summary>
              <div className="mt-4"><PropBoards sport="MLB" /></div>
            </details>
          </section>
        )}
      </main>
      <SlipTray />
    </div>
  );
}
