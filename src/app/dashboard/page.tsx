"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Bet, Sport } from "@/lib/types";
import { profitIfWon } from "@/lib/types";
import { DeskReview } from "@/components/DeskReview";

const SPORTS: Sport[] = ["MLB", "NFL", "NBA", "NHL", "NCAAF", "NCAAB", "Soccer", "UFC", "Other"];

const statusClass: Record<string, string> = {
  pending: "status-pending",
  won: "status-won",
  lost: "status-lost",
  push: "status-push",
  void: "status-void",
};

type CatalogPick = {
  id: string;
  sport: Sport;
  event: string;
  selection: string;
  market: string;
  score: number;
  research: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [picks, setPicks] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sport, setSport] = useState<Sport>("MLB");
  const [event, setEvent] = useState("");
  const [selection, setSelection] = useState("");
  const [odds, setOdds] = useState("-110");
  const [stake, setStake] = useState("1");
  const [notes, setNotes] = useState("");
  const [research, setResearch] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [catalog, setCatalog] = useState<CatalogPick[]>([]);
  const [chosen, setChosen] = useState("");
  const [catalogStatus, setCatalogStatus] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    setUser(user);
    const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
    setIsOwner(!!ownerEmail && user.email === ownerEmail);
    const { data } = await supabase
      .from("picks")
      .select("*")
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false });
    setPicks((data as Bet[]) || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!showForm) return;
    setCatalogStatus("Loading researched plays…");
    fetch("/api/research/catalog")
      .then((r) => r.json())
      .then((d) => {
        setCatalog(d.options || []);
        setCatalogStatus((d.options || []).length ? "" : "No researched plays loaded.");
      })
      .catch(() => setCatalogStatus("Could not load the research list."));
  }, [showForm]);

  const grouped = useMemo(() => {
    const map: Record<string, CatalogPick[]> = {};
    for (const p of catalog) {
      (map[p.sport] ||= []).push(p);
    }
    return map;
  }, [catalog]);

  function fillFrom(id: string) {
    setChosen(id);
    const p = catalog.find((x) => x.id === id);
    if (!p) return;
    setSport(p.sport);
    setEvent(p.event);
    setSelection(p.selection);
    setNotes(p.market);
    setResearch(p.research);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase.from("picks").insert({
      user_id: user.id,
      sport,
      event: event.trim(),
      selection: selection.trim(),
      odds: Number(odds),
      stake: Number(stake),
      notes: notes.trim() || null,
      research: research.trim() || null,
      status: "pending",
      is_public: isPublic,
    });
    if (error) { alert(error.message); return; }
    setEvent(""); setSelection(""); setOdds("-110"); setStake("1"); setNotes(""); setResearch(""); setChosen(""); setShowForm(false);
    load();
  }

  async function updateStatus(id: string, status: Bet["status"]) {
    const supabase = createClient();
    await supabase.from("picks").update({
      status,
      settled_at: status === "pending" ? null : new Date().toISOString(),
    }).eq("id", id);
    load();
  }

  async function tagReview(id: string, tag: string) {
    const bet = picks.find((p) => p.id === id);
    if (!bet) return;
    const note = bet.notes?.includes(tag) ? bet.notes : `${tag}${bet.notes ? ` | ${bet.notes}` : ""}`;
    const supabase = createClient();
    await supabase.from("picks").update({ notes: note }).eq("id", id);
    load();
  }

  async function togglePublic(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("picks").update({ is_public: !current }).eq("id", id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pick?")) return;
    const supabase = createClient();
    await supabase.from("picks").delete().eq("id", id);
    load();
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const wins = picks.filter((b) => b.status === "won").length;
  const losses = picks.filter((b) => b.status === "lost").length;
  let units = 0;
  for (const b of picks) {
    if (b.status === "won") units += profitIfWon(b.stake, b.odds);
    else if (b.status === "lost") units -= b.stake;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-semibold text-sm leading-tight">Dashboard</div>
              <div className="text-xs text-muted">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/research" className="text-muted hover:text-accent px-2 py-1">Research</Link>
            <Link href="/picks" className="text-muted hover:text-accent px-2 py-1">Public picks</Link>
            <button onClick={handleLogout} className="text-muted hover:text-danger px-2 py-1">Log out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Record", value: `${wins}-${losses}` },
            { label: "Units", value: units >= 0 ? `+${units.toFixed(2)}` : units.toFixed(2), color: units >= 0 ? "text-accent" : "text-danger" },
            { label: "Pending", value: String(picks.filter((p) => p.status === "pending").length) },
            { label: "Total", value: String(picks.length) },
          ].map((s) => (
            <div key={s.label} className="card px-4 py-3 text-center">
              <div className="text-xs text-muted uppercase">{s.label}</div>
              <div className={`text-lg font-bold font-mono mt-0.5 ${s.color || ""}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {isOwner && <DeskReview picks={picks} onTag={tagReview} />}

        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Your picks</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 text-sm">
            {showForm ? "Cancel" : "+ Add pick"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="card p-5 space-y-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Fill from research</label>
              <select className="input" value={chosen} onChange={(e) => fillFrom(e.target.value)}>
                <option value="">Select a researched play…</option>
                {Object.entries(grouped).map(([sp, rows]) => (
                  <optgroup key={sp} label={sp}>
                    {rows.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.score} · {p.selection} — {p.event}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {catalogStatus && <p className="text-[11px] text-muted mt-1">{catalogStatus}</p>}
              <p className="text-[11px] text-muted mt-1">Picks the sport, game, selection, and research. You still set odds and units.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Sport</label>
                <select className="input" value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Odds</label>
                <input className="input" value={odds} onChange={(e) => setOdds(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Event</label>
              <input className="input" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Yankees vs Red Sox" required />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Selection</label>
              <input className="input" value={selection} onChange={(e) => setSelection(e.target.value)} placeholder="Judge over 1.5 hits" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Stake (units)</label>
                <input className="input" type="number" step="0.1" value={stake} onChange={(e) => setStake(e.target.value)} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  Show on public picks
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Notes</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short note" />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Research (shown to followers)</label>
              <textarea className="input min-h-[80px]" value={research} onChange={(e) => setResearch(e.target.value)} placeholder="Why this play? Matchup data, trends, etc." />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-sm">Post pick</button>
          </form>
        )}

        {picks.length === 0 && !showForm && (
          <div className="card p-10 text-center text-muted"><p>No picks yet. Add your first play above.</p></div>
        )}

        <div className="space-y-3">
          {picks.map((bet) => {
            const oddsStr = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;
            return (
              <div key={bet.id} className="card p-4 space-y-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted">{bet.sport}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[bet.status]}`}>{bet.status.toUpperCase()}</span>
                      {bet.is_public && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">PUBLIC</span>}
                    </div>
                    <h3 className="font-semibold mt-1">{bet.event}</h3>
                    <p className="text-accent text-sm">{bet.selection}</p>
                  </div>
                  <div className="text-right font-mono text-sm">
                    <div className="font-semibold">{oddsStr}</div>
                    <div className="text-xs text-muted">{bet.stake}u</div>
                  </div>
                </div>
                {(bet.notes || bet.research) && (
                  <div className="text-xs text-muted border-t border-card-border pt-2">
                    {bet.notes}
                    {bet.research && <p className="mt-1 text-foreground/80">{bet.research}</p>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 border-t border-card-border pt-3">
                  {(["pending", "won", "lost", "push"] as const).map((s) => (
                    <button key={s} onClick={() => updateStatus(bet.id, s)} className={`text-xs px-2.5 py-1 rounded-md border ${
                      bet.status === s ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"
                    }`}>{s}</button>
                  ))}
                  <button onClick={() => togglePublic(bet.id, bet.is_public)} className="text-xs px-2.5 py-1 rounded-md border border-card-border text-muted ml-auto">
                    {bet.is_public ? "Unshare" : "Share"}
                  </button>
                  <button onClick={() => handleDelete(bet.id)} className="text-xs px-2.5 py-1 rounded-md border border-danger/40 text-danger">Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        {isOwner && (
          <p className="text-xs text-muted text-center">You are the owner — picks marked public appear on /picks for everyone.</p>
        )}
      </main>
    </div>
  );
}
