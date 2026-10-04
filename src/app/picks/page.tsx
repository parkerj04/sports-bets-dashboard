"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Bet } from "@/lib/types";
import { profitIfWon } from "@/lib/types";
import { groupPlaced, ticketStatus } from "@/lib/placed";

const statusClass: Record<string, string> = {
  pending: "status-pending", won: "status-won", lost: "status-lost", push: "status-push", void: "status-void",
};

const PLACED = [
  {
    id: "p53",
    title: "P53 · Lions at Panthers, agent 7-leg",
    stake: "1u",
    price: "Same-game parlay",
    result: "Pending",
    note: "Agent card, score 60. Rain fell from 43 percent to about 11 percent. Total moved 50.5 to 51.5. Coker is out, Legette is on IR, so McMillan is the Carolina target. Hubbard is the risk leg. Goff and Young passing yards were left off on purpose.",
    legs: [
      { pick: "Over 51.5", price: "-110", result: "Total already moved up 2" },
      { pick: "Lions -3.5", price: "-108", result: "Carolina corners on IR" },
      { pick: "Amon-Ra St. Brown over 77.5 receiving yards", price: "main", result: "Line moved from 75.5" },
      { pick: "Tetairoa McMillan over 72.5 receiving yards", price: "main", result: "Coker out, Legette on IR" },
      { pick: "Jahmyr Gibbs over 96.5 rushing yards", price: "main", result: "Line moved from 94.5. His floor was 52" },
      { pick: "Chuba Hubbard over 64.5 rushing yards", price: "main", result: "Risk leg. Detroit run defense improved" },
      { pick: "Jahmyr Gibbs anytime", price: "-325", result: "Same path as the rush leg" },
    ],
  },
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
    note: "Same three sides on the moneyline. Ticket payout shown $103.76.",
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
      .then(({ data, error }) => { if (!error && data) setPicks(data as Bet[]); setLoading(false); });
  }, []);
  const { singles, tickets } = groupPlaced(picks);
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm">Public picks</Link>
          <div className="flex gap-3 text-sm">
            <Link href="/research" className="text-muted hover:text-accent">Research</Link>
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {PLACED.map((ticket) => (
          <div key={ticket.id} className="card p-4 space-y-2">
            <div className="flex gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{ticket.id === "p53" ? "NFL" : "NCAAF"}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.result === "Won" ? "status-won" : "status-pending"}`}>{ticket.result.toUpperCase()}</span>
            </div>
            <h3 className="font-semibold">{ticket.title}</h3>
            <p className="text-sm text-muted">{ticket.stake} · {ticket.price}</p>
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
        {tickets.map(([name, legs]) => (
          <div key={name} className="card p-4 space-y-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[ticketStatus(legs)]}`}>{ticketStatus(legs).toUpperCase()}</span>
            <h3 className="font-semibold">{name} · {legs.length} legs</h3>
            {legs.map((leg) => <p key={leg.id} className="text-sm text-accent">{leg.selection}</p>)}
          </div>
        ))}
        {singles.map((bet) => (
          <div key={bet.id} className="card p-4">
            <h3 className="font-semibold">{bet.event}</h3>
            <p className="text-accent text-sm">{bet.selection}</p>
            <p className="font-mono text-sm">{bet.odds > 0 ? `+${bet.odds}` : bet.odds} · {bet.stake}u · to win {profitIfWon(bet.stake, bet.odds).toFixed(2)}u</p>
          </div>
        ))}
      </main>
    </div>
  );
}
