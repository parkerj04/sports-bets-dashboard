"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Bet } from "@/lib/types";
import { profitIfWon } from "@/lib/types";
import { groupPlaced, ticketStatus } from "@/lib/placed";

const statusClass: Record<string, string> = {
  pending: "status-pending",
  won: "status-won",
  lost: "status-lost",
  push: "status-push",
  void: "status-void",
};

export default function PicksPage() {
  const [picks, setPicks] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("picks").select("*").eq("is_public", true).order("placed_at", { ascending: false }).limit(50)
      .then(({ data, error }) => {
        if (!error && data) setPicks(data as Bet[]);
        setLoading(false);
      });
  }, []);

  const { singles, tickets } = groupPlaced(picks);

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl">🎯</Link>
            <div>
              <div className="font-semibold text-sm">Public Picks</div>
              <div className="text-xs text-muted">Bets that were placed. A parlay is one ticket.</div>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/research" className="text-muted hover:text-accent">Research</Link>
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading && <p className="text-muted text-center py-10">Loading picks…</p>}
        {!loading && picks.length === 0 && (
          <div className="card p-10 text-center text-muted">
            <p className="text-lg mb-1">No public picks yet</p>
            <p className="text-sm">Check back once a placed bet is shared.</p>
          </div>
        )}
        {tickets.map(([name, legs]) => {
          const status = ticketStatus(legs);
          const stake = legs[0]?.stake || 0;
          return (
            <div key={name} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{legs[0].sport}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[status]}`}>{status.toUpperCase()}</span>
                  </div>
                  <h3 className="font-semibold mt-1.5">{name} · {legs.length} legs</h3>
                  <p className="text-sm text-muted">{legs[0].event}</p>
                </div>
                <div className="text-right text-xs text-muted">{stake}u on the ticket</div>
              </div>
              {legs.map((leg) => (
                <div key={leg.id} className="border-t border-card-border pt-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-accent">{leg.selection.replace(/\s*\(P\d+ leg \d+\/\d+\)/, "")}</span>
                    <span className="font-mono text-xs">{leg.odds > 0 ? `+${leg.odds}` : leg.odds}</span>
                  </div>
                  {leg.research && <p className="text-xs text-muted mt-1">{leg.research}</p>}
                </div>
              ))}
            </div>
          );
        })}
        {singles.map((bet) => {
          const oddsStr = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;
          return (
            <div key={bet.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-muted">{bet.sport}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass[bet.status]}`}>{bet.status.toUpperCase()}</span>
                  </div>
                  <h3 className="font-semibold mt-1.5">{bet.event}</h3>
                  <p className="text-accent font-medium text-sm">{bet.selection}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold">{oddsStr}</div>
                  <div className="text-xs text-muted">{bet.stake}u · to win {profitIfWon(bet.stake, bet.odds).toFixed(2)}u</div>
                </div>
              </div>
              {(bet.notes || bet.research) && (
                <div className="text-sm text-muted border-t border-card-border pt-2 space-y-1">
                  {bet.notes && <p>{bet.notes}</p>}
                  {bet.research && <p className="text-xs">{bet.research}</p>}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
