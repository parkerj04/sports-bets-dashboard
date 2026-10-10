"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Play = { id: string; game: string; away: string; home: string; pick: string; score: number | null; why: string; status?: string };

function agentOf(id: string) {
  const name = (id || "").split("-")[0];
  return name ? name[0].toUpperCase() + name.slice(1) : "Agent";
}

function dayOf(id: string) {
  const m = (id || "").match(/2026\d{4}/);
  return m ? m[0] : "";
}

export default function BoardPage() {
  const [rows, setRows] = useState<Play[] | null>(null);
  useEffect(() => {
    fetch("/api/agent/plays")
      .then((r) => r.json())
      .then((d) => setRows(d.plays || []))
      .catch(() => setRows([]));
  }, []);
  const live = (rows || []).filter((p) => p.status === "intake" && ["20261009", "20261010", "20261011", "20261012"].includes(dayOf(p.id)));
  const groups = new Map<string, Play[]>();
  for (const p of live) {
    const key = p.game || "Unassigned";
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#101614", color: "#e8eee9" }}>
      <div className="mx-auto max-w-lg">
        <Link href="/research" className="text-sm" style={{ color: "#9aa89f" }}>← Research</Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">AGENT CARDS</h1>
        <p className="mt-2 text-sm leading-6" style={{ color: "#b7c2bb" }}>
          Every intake card for this slate. The name is the agent. Nothing is cut here.
        </p>
        {rows === null ? <p className="mt-4 text-sm" style={{ color: "#9aa89f" }}>Loading cards…</p> : null}
        <div className="mt-4 space-y-4">
          {[...groups.entries()].map(([game, cards]) => (
            <section key={game}>
              <h2 className="text-sm" style={{ color: "#9aa89f" }}>{game}</h2>
              <div className="mt-2 space-y-2">
                {cards.map((p) => (
                  <article key={p.id} className="rounded-2xl p-3" style={{ background: "#1a2420", border: "1px solid #2b3631" }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-lg font-semibold">{agentOf(p.id)} · {p.pick}</div>
                      <div className="font-mono text-sm">{p.score ?? "—"}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6" style={{ color: "#c5d0c9" }}>{p.why}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {rows && live.length === 0 ? <p className="text-sm" style={{ color: "#9aa89f" }}>No intake card for this slate.</p> : null}
        </div>
      </div>
    </main>
  );
}
