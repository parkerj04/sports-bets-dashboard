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

function slateFloor() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  let y = Number(get("year"));
  let m = Number(get("month"));
  let d = Number(get("day"));
  if (Number(get("hour")) < 2) {
    const prev = new Date(Date.UTC(y, m - 1, d));
    prev.setUTCDate(prev.getUTCDate() - 1);
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth() + 1;
    d = prev.getUTCDate();
  }
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
}

function callFor(p: Play) {
  if ((p.score || 0) >= 70) return "Cut";
  return "Cap";
}

function tone(call: string) {
  if (call === "Keep") return "#3f6b45";
  if (call === "Cut") return "#c45c4a";
  return "#b8881e";
}

function boxes(rows: Play[]) {
  const groups = new Map<string, Play[]>();
  const singles: Play[] = [];
  for (const row of rows) {
    const key = row.id.match(/parlay[-:][a-z0-9]+/i)?.[0];
    if (key || /parlay/i.test(row.pick)) {
      const id = key || row.game;
      groups.set(id, [...(groups.get(id) || []), row]);
    } else singles.push(row);
  }
  return [...groups.values(), ...singles.map((row) => [row])];
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

  const floor = slateFloor();
  const open = rows.filter((p) => {
    const status = String(p.status || "intake").toLowerCase();
    if (CLOSED.has(status)) return false;
    const day = dayKey(p.id);
    return !day || day >= floor;
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
        <h1 className="text-xl font-medium">Desk review</h1>
        <p className="text-sm text-muted">Open intake only. A finished game drops off at 2:00 AM Eastern. A parlay is one box.</p>
        {err && <p className="text-sm text-negative">{err}</p>}
        {!err && !open.length && <p className="text-sm text-muted">No open intake.</p>}
        {boxes(open).map((legs) => {
          const first = legs[0];
          const call = callFor(first);
          return (
            <article key={first.id} className="border p-3 text-sm" style={{ background: "#0e0e0c", color: "#f0eee6", borderColor: "#2c2c28" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">{first.game}</div>
                  {legs.map((leg) => <div key={leg.id} className="mt-1">{leg.pick}</div>)}
                </div>
                <span className="font-mono">{first.score}</span>
              </div>
              <p className="mt-2 font-medium" style={{ color: tone(call) }}>{call}</p>
            </article>
          );
        })}
      </main>
    </div>
  );
}
