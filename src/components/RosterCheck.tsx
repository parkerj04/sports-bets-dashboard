"use client";

import { useEffect, useState } from "react";

type Side = { team: string; count: number; movedOut: string[]; movedIn: string[]; confirmed: boolean };

export function RosterCheck({ sport, away, home, awayAbbr, homeAbbr, awayId, homeId }: {
  sport: "nfl" | "mlb";
  away: string;
  home: string;
  awayAbbr?: string;
  homeAbbr?: string;
  awayId?: number;
  homeId?: number;
}) {
  const [data, setData] = useState<{ away: Side; home: Side; rule: string } | null>(null);
  useEffect(() => {
    const q = new URLSearchParams({ sport, away, home });
    if (awayAbbr) q.set("awayAbbr", awayAbbr);
    if (homeAbbr) q.set("homeAbbr", homeAbbr);
    if (awayId) q.set("awayId", String(awayId));
    if (homeId) q.set("homeId", String(homeId));
    fetch(`/api/research/roster?${q}`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, [sport, away, home, awayAbbr, homeAbbr, awayId, homeId]);
  if (!data?.away) return null;
  return (
    <div className="card p-4 text-sm space-y-2">
      <div className="text-xs text-muted uppercase">Roster confirmation</div>
      <SideRow s={data.away} />
      <SideRow s={data.home} />
      <p className="text-xs text-muted">{data.rule} Day-to-day moves are a confirmation, not a guess. If the feed has not moved the player, the card says so.</p>
    </div>
  );
}

function SideRow({ s }: { s: Side }) {
  return (
    <div>
      <div className="font-medium">{s.team} · {s.confirmed ? "feed confirmed" : "not fully confirmed"} · {s.count} listed</div>
      {s.movedOut.length > 0 && <p className="text-danger text-xs">Still listed after a move: {s.movedOut.join(", ")}</p>}
      {s.movedIn.length > 0 && <p className="text-warning text-xs">{s.movedIn.join("; ")}</p>}
    </div>
  );
}
