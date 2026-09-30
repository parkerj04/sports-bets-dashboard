"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bet } from "@/lib/types";
import { getAuth, getBets, saveBets, logout, setStoredPassword } from "@/lib/storage";
import { BetCard } from "@/components/BetCard";
import { StatsBar } from "@/components/StatsBar";
import { AddBetForm } from "@/components/AddBetForm";

export default function DashboardPage() {
  const router = useRouter();
  const [bets, setBets] = useState<Bet[]>([]);
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isLoggedIn) {
      router.replace("/");
      return;
    }
    setName(auth.displayName);
    setBets(getBets());
    setReady(true);
  }, [router]);

  const persist = useCallback((next: Bet[]) => {
    setBets(next);
    saveBets(next);
  }, []);

  function handleAdd(data: Omit<Bet, "id" | "placedAt">) {
    const bet: Bet = {
      ...data,
      id: crypto.randomUUID(),
      placedAt: new Date().toISOString(),
    };
    persist([bet, ...bets]);
  }

  function handleStatus(id: string, status: Bet["status"]) {
    persist(
      bets.map((b) =>
        b.id === id
          ? { ...b, status, settledAt: status === "pending" ? undefined : new Date().toISOString() }
          : b
      )
    );
  }

  function handleTogglePublic(id: string) {
    persist(bets.map((b) => (b.id === id ? { ...b, isPublic: !b.isPublic } : b)));
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this bet?")) return;
    persist(bets.filter((b) => b.id !== id));
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  function handleChangePassword() {
    if (newPw.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    setStoredPassword(newPw);
    setNewPw("");
    setShowSettings(false);
    alert("Password updated");
  }

  const filtered =
    filter === "all"
      ? bets
      : filter === "pending"
        ? bets.filter((b) => b.status === "pending")
        : bets.filter((b) => b.status !== "pending");

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-semibold text-sm leading-tight">Sports Bets</div>
              <div className="text-xs text-muted">{name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/plays" className="text-muted hover:text-accent px-2 py-1">
              Public plays
            </Link>
            <button onClick={() => setShowSettings(!showSettings)} className="text-muted hover:text-foreground px-2 py-1">
              Settings
            </button>
            <button onClick={handleLogout} className="text-muted hover:text-danger px-2 py-1">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {showSettings && (
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Settings</h2>
            <p className="text-xs text-muted">
              Current password is stored only in this browser. Default was <code className="text-accent">bets123</code>.
            </p>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <button onClick={handleChangePassword} className="btn-primary px-4 text-sm">
                Update
              </button>
            </div>
            <p className="text-xs text-muted">
              Tip: Share the link <code className="text-accent">/plays</code> with friends so they can see your public bets.
            </p>
          </div>
        )}

        <StatsBar bets={bets} />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 bg-card rounded-lg p-1 border border-card-border">
            {(["all", "pending", "settled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md capitalize transition-colors ${
                  filter === f ? "bg-accent/20 text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <AddBetForm onAdd={handleAdd} />
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <p className="text-lg mb-1">No bets yet</p>
            <p className="text-sm">Hit “Add Bet” to track your first play.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                showActions
                onStatusChange={handleStatus}
                onTogglePublic={handleTogglePublic}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
