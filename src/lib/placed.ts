import type { Bet } from "@/lib/types";

export function ticketOf(bet: Bet) {
  const m = `${bet.selection} ${bet.notes || ""}`.match(/\bP(\d+)\b/i);
  return m ? `P${m[1]}` : "";
}

export function groupPlaced(picks: Bet[]) {
  const singles: Bet[] = [];
  const groups = new Map<string, Bet[]>();
  for (const bet of picks) {
    const ticket = ticketOf(bet);
    if (!ticket) singles.push(bet);
    else groups.set(ticket, [...(groups.get(ticket) || []), bet]);
  }
  return { singles, tickets: Array.from(groups.entries()) };
}

export function ticketStatus(legs: Bet[]): Bet["status"] {
  if (legs.some((l) => l.status === "lost")) return "lost";
  if (legs.every((l) => l.status === "won")) return "won";
  if (legs.some((l) => l.status === "push")) return "push";
  return "pending";
}
