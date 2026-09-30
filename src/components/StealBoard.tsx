"use client";

import type { Edge } from "@/lib/mlb";
import { scoreTone } from "@/lib/score-color";
import { isPlayable } from "@/lib/edges";
import { SlipCheck } from "@/components/SlipTray";

export function StealBoard({ edges }: { edges: Edge[] }) {
  if (!edges.length) return null;
  const live = edges.filter(isPlayable);
  const watch = edges.filter((e) => !isPlayable(e));
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Stolen bases</h2>
      <p className="text-xs text-muted">Season SB/CS plus the opposing catcher's throw-out rate. Playable only if volume and success both clear and the catcher is not a high-CS% arm.</p>
      {live.map((e, i) => <Card key={i} e={e} live />)}
      {watch.map((e, i) => <Card key={`w${i}`} e={e} live={false} />)}
    </section>
  );
}

function Card({ e, live }: { e: Edge; live: boolean }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-xs text-muted uppercase">{e.market}{live ? "" : " · research only"}</div>
          <div className="font-semibold">{e.pick}</div>
          <div className="text-xs text-muted">{e.team} vs {e.pitcher}</div>
        </div>
        <div className={`text-2xl font-mono font-bold ${scoreTone(e.edgeScore)}`}>{e.edgeScore}</div>
      </div>
      <p className="text-sm">{e.reasoning}</p>
      <SlipCheck item={{
        id: `sb-${e.gamePk}-${e.pick}`,
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
