"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { scoreTone } from "@/lib/score-color";

type Pick = { game: string; market: string; pick: string; score: number; why: string; href?: string };

export function SportPicks({ sport }: { sport: "NFL" | "CFB" }) {
  const [picks, setPicks] = useState<Pick[]>([]);
  useEffect(() => {
    fetch(sport === "NFL" ? "/api/research/nfl/picks" : "/api/research/cfb/picks")
      .then((r) => r.json())
      .then((d) => setPicks(d.picks || []))
      .catch(() => setPicks([]));
  }, [sport]);
  if (!picks.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{sport} researched picks</h2>
      <p className="text-xs text-muted">One card per game. Score is the matchup, not the price. Green 75+, yellow 60–74, red under 60.</p>
      {picks.map((p, i) => (
        <Link key={i} href={p.href || "/research"} className="card p-4 block">
          <div className="flex justify-between gap-3">
            <div>
              <div className="text-xs text-muted uppercase">{p.market}</div>
              <div className="font-semibold">{p.pick}</div>
              <div className="text-sm text-muted">{p.game}</div>
            </div>
            <div className={`font-mono text-2xl ${scoreTone(p.score)}`}>{p.score}</div>
          </div>
          <p className="text-sm text-muted mt-2">{p.why}</p>
        </Link>
      ))}
    </section>
  );
}
