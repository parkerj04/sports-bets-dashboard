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

const PLACED = [
  {
    id: "fri-spread",
    title: "3-leg parlay",
    stake: "3u ($30)",
    price: "+421, boosted to +631",
    result: "Won",
    note: "Liberty covered 30-14. Pitt covered 35-33. Northwestern finished 34-13, so +3.5 covered. Payout shown $219.39.",
    legs: [
      { pick: "Northwestern +3.5", price: "-107", result: "Won, 34-13" },
      { pick: "Liberty -6.5", price: "+103", result: "Won, 30-14" },
      { pick: "Pittsburgh +3.5", price: "-119", result: "Won, 35-33" },
    ],
  },
  {
    id: "fri-ml",
    title: "3-leg parlay, bonus bet",
    stake: "2u bonus ($20)",
    price: "+518",
    result: "Won",
    note: "Same three sides on the moneyline. Pitt and Liberty were already in. Northwestern closed it at 34-13. Ticket payout shown $103.76. A $100.80 cash-out was sitting there if it was taken.",
    legs: [
      { pick: "Northwestern moneyline", price: "+116", result: "Won, 34-13" },
      { pick: "Pittsburgh moneyline", price: "+108", result: "Won, 35-33" },
      { pick: "Liberty moneyline", price: "-265", result: "Won, 30-14" },
    ],
  },
];

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
              <div className="text-xs text-muted">Bets that were placed. 1u is $10. A parlay is one ticket.</div>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/research" className="text-muted hover:text-accent">Research</Link>
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {PLACED.map((ticket) => (
          <div key={ticket.id} className="card p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">NCAAF</span>
                  <span className="text-xs px-2 py-0.5 rounded-full status-won">WON</span>
                </div>
                <h3 className="font-semibold mt-1.5">{ticket.title}</h3>
                <p className="text-sm text-muted">{ticket.stake} · {ticket.price}</p>
              </div>
            </div>
            {ticket.legs.map((leg) => (
              <div key={leg.pick} className="border-t border-card-border pt-2 text-sm">
                <div className="flex justify-between gap-2"><span className="text-accent">{leg.pick}</span><span className="font-mono text-xs">{leg.price}</span></div>
                <p className="text-xs text-muted">{leg.result}</p>
              </div>
            ))}
            <p className="text-xs text-muted border-t border-card-border pt-2">{ticket.note}</p>
          </div>
        ))}
        {loading && <p className="text-muted text-center py-10">Loading picks…</p>}
        {tickets.map(([name, legs]) => {
          const status = ticketStatus(legs);
          return (
            <div key={name} className="card p-4 space-y-2">
              <div className="flex justify-between gap-3">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[status]}`}>{status.toUpperCase()}</span>
                  <h3 className="font-semibold mt-1.5">{name} · {legs.length} legs</h3>
                </div>
                <div className="text-xs text-muted">{legs[0].stake}u</div>
              </div>
              {legs.map((leg) => (
                <div key={leg.id} className="border-t border-card-border pt-2 text-sm">
                  <span className="text-accent">{leg.selection.replace(/\s*\(P\d+ leg \d+\/\d+\)/, "")}</span>
                </div>
              ))}
            </div>
          );
        })}
        {singles.map((bet) => (
          <div key={bet.id} className="card p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[bet.status]}`}>{bet.status.toUpperCase()}</span>
                <h3 className="font-semibold mt-1.5">{bet.event}</h3>
                <p className="text-accent text-sm">{bet.selection}</p>
              </div>
              <div className="font-mono text-sm">{bet.odds > 0 ? `+${bet.odds}` : bet.odds}<div className="text-xs text-muted">{bet.stake}u · to win {profitIfWon(bet.stake, bet.odds).toFixed(2)}u</div></div>
            </div>
            {bet.research && <p className="text-xs text-muted">{bet.research}</p>}
          </div>
        ))}
      </main>
    </div>
  );
}
