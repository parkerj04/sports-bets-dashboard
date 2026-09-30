"use client";

import { Bet, profitIfWon } from "@/lib/types";

interface Props {
  bets: Bet[];
}

export function StatsBar({ bets }: Props) {
  const settled = bets.filter((b) => b.status === "won" || b.status === "lost" || b.status === "push");
  const wins = bets.filter((b) => b.status === "won").length;
  const losses = bets.filter((b) => b.status === "lost").length;
  const pending = bets.filter((b) => b.status === "pending").length;

  let unitsWon = 0;
  let unitsStaked = 0;

  for (const b of settled) {
    unitsStaked += b.stake;
    if (b.status === "won") unitsWon += profitIfWon(b.stake, b.odds);
    else if (b.status === "lost") unitsWon -= b.stake;
  }

  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "—";
  const roi = unitsStaked > 0 ? ((unitsWon / unitsStaked) * 100).toFixed(1) : "—";

  const items = [
    { label: "Record", value: `${wins}-${losses}` },
    { label: "Win %", value: winRate === "—" ? "—" : `${winRate}%` },
    { label: "Units", value: unitsWon >= 0 ? `+${unitsWon.toFixed(2)}` : unitsWon.toFixed(2), color: unitsWon >= 0 ? "text-accent" : "text-danger" },
    { label: "ROI", value: roi === "—" ? "—" : `${roi}%`, color: Number(roi) >= 0 ? "text-accent" : "text-danger" },
    { label: "Pending", value: String(pending) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item) => (
        <div key={item.label} className="card px-4 py-3 text-center">
          <div className="text-xs text-muted uppercase tracking-wide">{item.label}</div>
          <div className={`text-lg font-bold mt-0.5 font-mono ${item.color || ""}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
