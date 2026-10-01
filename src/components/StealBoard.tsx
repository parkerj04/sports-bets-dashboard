"use client";

import type { Edge } from "@/lib/mlb";
import { scoreTone } from "@/lib/score-color";
import { isPlayable } from "@/lib/edges";
import { SlipCheck } from "@/components/SlipTray";

export function StealBoard({ edges }: { edges: Edge[] }) {
  const shown = edges.slice(0, 2);
  if (!shown.length) return null;
  const live = shown.filter(isPlayable);
  const watch = shown.filter((e) => !isPlayable(e));
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Stolen bases</h2>
      <p className="text-xs text-muted">Top one or two runners in this game only. Ranked by SB volume, success, sprint speed, pitcher hold, and catcher arm. Everyone else is left off.</p>
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
