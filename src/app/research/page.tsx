"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameMatchup } from "@/lib/mlb";
import type { MlbLine } from "@/lib/mlb-odds";
import type { NflGame } from "@/lib/nfl";
import { BrandMark } from "@/components/Logo";
import { AccountMark } from "@/components/AccountMark";
import { PropBoards } from "@/components/PropBoards";
import { CfbBoard } from "@/components/CfbBoard";
import { SportPicks } from "@/components/SportPicks";
import { SlipTray } from "@/components/SlipTray";
import { TrendBoard } from "@/components/TrendBoard";
import { PlayCard } from "@/components/PlayCard";

type Sport = "MLB" | "NFL" | "CFB";
type SlateGame = GameMatchup & { line?: MlbLine | null };
type ResultNote = { id: string; game: string; scoreline: string; cards: string[] };

function firstPitch(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(d)} ET`;
}

function slateDay(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/New_York" }).format(d);
}

function boardPrice(spread: string) {
  const n = Math.abs(parseFloat((String(spread).match(/-?\d+(?:\.\d+)?/) || [""])[0]));
  if (!Number.isFinite(n)) return spread;
  return n >= 100 ? `ML ${spread}` : `RL ${spread}`;
}

function nflSide(g: NflGame) {
  const side = (g.leanML || "").replace(/ ML$/, "") || g.home;
  const price = side === g.home ? g.mlHome : side === g.away ? g.mlAway : "";
  return { title: side, price };
}

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
      <header className="desk sticky top-0 z-10 border-b border-card-border bg-background/90 backdrop-blur">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link href="/dashboard" className="flex min-w-0 flex-1"><BrandMark wide /></Link>
          <Link href="/research/desk" className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-accent/40 bg-card px-2.5 text-xs font-medium text-accent">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <rect x="2" y="19.2" width="20" height="3.2" rx="0.7" />
              <rect x="3.2" y="17.8" width="17.6" height="1.6" rx="0.4" />
              <g transform="translate(0.6 -3.2) rotate(-50 12 16)">
                <rect x="6" y="13.6" width="12.4" height="4.4" rx="2.2" />
                <rect x="10.6" y="2.2" width="2.6" height="11.8" rx="1.3" />
              </g>
            </svg>
            Desk review
          </Link>
          <AccountMark inline />
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
            <h1 className="text-2xl font-semibold tracking-tight">NFL Week {nfl.week || "\u2014"}</h1>
            <p className="text-sm leading-relaxed text-muted">One card per game. The badge stays off until a number beats the price. Open why, then open the game.</p>
            {loading && <p className="text-sm text-muted">Loading NFL\u2026</p>}
            {nfl.games.map((g) => {
              const side = nflSide(g);
              return (
                <PlayCard
                  key={g.id}
                  href={`/research/nfl/game?id=${g.id}`}
                  kicker={g.broadcast === "Prime Video" ? "Thursday night" : "NFL"}
                  title={side.title}
                  price={side.price}
                  when={`${firstPitch(g.date) || "Time TBD"} \u00b7 ${g.away} at ${g.home}`}
                  line={`Spread ${g.spread} \u00b7 Total ${g.total}${g.venue ? ` \u00b7 ${g.venue}` : ""}`}
                  fors={g.aligns?.length ? g.aligns : ["Nothing in the registry is stacked."]}
                  againsts={[...(g.misses || []), "Injuries, the quarterback, and the last five are inside the game, not on this card."]}
                />
              );
            })}
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
            <h1 className="text-2xl font-semibold tracking-tight">MLB slate</h1>
            <p className="text-sm leading-relaxed text-muted">{slateDay(games[0]?.gameDate) || "Today"}. One card per game. The starters are named here. The lineup is inside the game.</p>
            {loading && <p className="text-sm text-muted">Loading slate\u2026</p>}
            {error && !loading && <p className="text-sm text-danger">{error}</p>}
            {games.map((g) => (
              <PlayCard
                key={g.gamePk}
                href={`/research/game?id=${g.gamePk}`}
                kicker="MLB"
                title={`${g.awayTeam} at ${g.homeTeam}`}
                when={firstPitch(g.gameDate) || "Time TBD"}
                line={g.line ? `${boardPrice(g.line.spread)} \u00b7 Total ${g.line.total}` : "No posted line"}
                fors={[g.awayPitcher && g.homePitcher ? `${g.awayPitcher} vs ${g.homePitcher}` : "Both starters are not named yet."]}
                againsts={[!g.awayPitcher || !g.homePitcher ? "A starter is still TBD." : "The lineup and the weather are inside the game, not on this card."]}
              />
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
