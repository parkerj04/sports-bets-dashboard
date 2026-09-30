"use client";

import type { Ticket } from "@/lib/ticket";

export function TicketDesk({ ticket }: { ticket: Ticket }) {
  return (
    <section className="card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Ticket desk</h2>
        <p className="text-xs text-muted mt-1">Walk this before a unit. A card is not playable if a FLAG sits on that market.</p>
      </div>
      <ol className="space-y-2">
        {ticket.checks.map((c, i) => (
          <li key={c.id} className="text-sm flex gap-2">
            <span className={`shrink-0 font-mono text-xs mt-0.5 ${c.ok === true ? "text-good" : c.ok === false ? "text-danger" : "text-warning"}`}>
              {i + 1}. {c.ok === true ? "OK" : c.ok === false ? "FLAG" : "OPEN"}
            </span>
            <span>
              <span className="font-medium">{c.label}</span>
              {c.detail ? <span className="text-muted"> — {c.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">Script: {ticket.script}. {ticket.notes.join(" ")}</p>
    </section>
  );
}
