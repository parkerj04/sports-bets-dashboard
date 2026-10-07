"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Logo";

type Play = { id: string; game: string; away?: string; home?: string; pick: string; score: number; why: string; status?: string };

const CLOSED = new Set(["won", "lost", "final", "graded", "archived_superseded", "superseded", "published"]);

function dayKey(id: string) {
  const hit = id.match(/20\d{6}/);
  return hit ? hit[0] : "";
}

function callFor(p: Play) {
  if (p.id.includes("tb-nyy") || /rays \+1/i.test(p.pick)) return "Cap 54. Not a keep.";
  if ((p.score || 0) >= 70) return "Cut the number. A 70 needs three confirms.";
  return "In review.";
}

export default function DeskPage() {
  const [rows, setRows] = useState<Play[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/agent/plays")
      .then((r) => r.json())
      .then((d) => setRows(d.plays || []))
      .catch(() => setErr("Intake did not load."));
  }, []);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const open = rows.filter((p) => {
    const status = String(p.status || "intake").toLowerCase();
    if (CLOSED.has(status)) return false;
    const day = dayKey(p.id);
    return !day || day >= today;
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard"><BrandMark /></Link>
          <Link href="/research" className="text-sm text-muted hover:text-accent">Slate</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold">Desk review</h1>
        <p className="text-sm text-muted">Open agent cards only. Finished games and last week's intake stay off. The corner number is the agent's. The call is F.R.I.D.A.Y. Nothing here is a placed bet.</p>
        {err && <p className="text-sm text-negative">{err}</p>}
        {!err && !open.length && <p className="text-sm text-muted">No open agent card for today.</p>}
        {open.map((p) => (
          <article key={p.id} className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">{p.game}</h2>
              <span className="font-mono">{p.score}</span>
            </div>
            <p className="font-semibold">{p.pick}</p>
            <p><span className="text-muted">Call. </span>{callFor(p)}</p>
            <p className="leading-6">{p.why}</p>
          </article>
        ))}
      </main>
    </div>
  );
}
