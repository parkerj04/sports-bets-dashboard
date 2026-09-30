"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bet } from "@/lib/types";
import { getBets } from "@/lib/storage";
import { BetCard } from "@/components/BetCard";

export default function PlaysPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const all = getBets();
    setBets(all.filter((b) => b.isPublic));
    setLoaded(true);
  }, []);

  const pending = bets.filter((b) => b.status === "pending");
  const recent = bets
    .filter((b) => b.status !== "pending")
    .sort((a, b) => (b.settledAt || b.placedAt).localeCompare(a.settledAt || a.placedAt))
    .slice(0, 10);

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-semibold">Public Plays</div>
              <div className="text-xs text-muted">Shared bets · live updates in this browser</div>
            </div>
          </div>
          <Link href="/" className="text-sm text-muted hover:text-accent">
            Owner login
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {!loaded ? (
          <p className="text-muted text-center py-10">Loading…</p>
        ) : bets.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <p className="text-lg mb-1">No public plays yet</p>
            <p className="text-sm">
              The owner hasn’t shared any bets. Check back later.
            </p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Open Plays ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-muted">No open plays right now.</p>
              ) : (
                <div className="space-y-3">
                  {pending.map((bet) => (
                    <BetCard key={bet.id} bet={bet} />
                  ))}
                </div>
              )}
            </section>

            {recent.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                  Recent Results
                </h2>
                <div className="space-y-3">
                  {recent.map((bet) => (
                    <BetCard key={bet.id} bet={bet} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-xs text-muted text-center pt-4">
          Data is stored in the owner’s browser. For a live multi-device share, connect a backend later.
        </p>
      </main>
    </div>
  );
}
