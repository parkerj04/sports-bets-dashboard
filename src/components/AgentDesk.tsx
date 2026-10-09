"use client";

import { useEffect, useState } from "react";

type Play = { id: string; pick: string; score: number; why: string; status?: string; game?: string; away?: string; home?: string };

const CLOSED = new Set(["published", "archived_superseded", "superseded", "won", "lost", "final", "graded"]);

function tone(call: string) {
  if (call === "Keep") return "#3f6b45";
  if (call === "Cut" || call === "Fade") return "#c45c4a";
  return "#b8881e";
}
function callFor(p: Play) {
  const text = `${p.pick} ${p.why}`.toLowerCase();
  if (/\bfade\b/.test(text)) return "Fade";
  if (/shell not charted|not a number|do not post/.test(text)) return "Pass";
  if ((p.score || 0) >= 70) return "Cut";
  return "Pass";
}

function ModelBox({ rows }: { rows: Play[] }) {
  if (!rows.length) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium">Model</h3>
      {rows.map((p) => {
        const call = callFor(p);
        return (
          <article key={p.id} className="border p-3 text-sm" style={{ background: "#0e0e0c", color: "#f0eee6", borderColor: "#2c2c28" }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-widest">This game</p>
              <span className="font-medium" style={{ color: tone(call) }}>{call}</span>
            </div>
            <p className="mt-2">{p.pick}</p>
            <p className="mt-2 leading-6 whitespace-pre-wrap" style={{ color: "#c8c4b8" }}>{p.why}</p>
          </article>
        );
      })}
    </section>
  );
}

function teamHit(page: string, code: string) {
  const t = page.toUpperCase();
  const c = code.toUpperCase();
  const map: Record<string, string[]> = {
    NE: ["PATRIOT"], BUF: ["BILL"], TEN: ["TITAN"], BAL: ["RAVEN"],
    MIA: ["DOLPHIN"], MIN: ["VIKING"], KC: ["CHIEF"], LV: ["RAIDER"],
    DET: ["LION"], CAR: ["PANTHER"], LAD: ["DODGER"], ATL: ["BRAVE"],
    TB: ["BUCCANEER"], DAL: ["COWBOY"], GB: ["PACKER"], CHI: ["BEAR"],
    PHI: ["EAGLE"], JAX: ["JAGUAR"],
  };
  return c === t || t.includes(c) || c.includes(t) || (map[c] || []).some((w) => t.includes(w));
}
function onGame(away: string, home: string, p: Play) {
  const blob = `${p.away || ""} ${p.home || ""} ${p.game || ""}`;
  return (teamHit(blob, away) && teamHit(blob, home)) || (teamHit(away, p.away || "") && teamHit(home, p.home || ""));
}
export function AgentDesk({ away, home }: { away: string; home: string }) {
  const [rows, setRows] = useState<Play[]>([]);
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/agent/plays?away=${encodeURIComponent(away)}&home=${encodeURIComponent(home)}`)
      .then((r) => r.json()).then((d) => setRows(d.plays || [])).catch(() => setRows([]));
  }, [away, home]);
  const open = rows.filter((p) => !CLOSED.has(String(p.status || "intake").toLowerCase()));
  const model = open.filter((p) => String(p.id || "").startsWith("model-") && onGame(away, home, p));
  if (!model.length) return null;
  return <ModelBox rows={model} />;
}
