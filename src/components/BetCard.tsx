"use client";

import { Bet, profitIfWon } from "@/lib/types";

const statusClass: Record<string, string> = {
  pending: "status-pending",
  won: "status-won",
  lost: "status-lost",
  push: "status-push",
  void: "status-void",
};

interface Props {
  bet: Bet;
  onStatusChange?: (id: string, status: Bet["status"]) => void;
  onTogglePublic?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export function BetCard({ bet, onStatusChange, onTogglePublic, onDelete, showActions = false }: Props) {
  const oddsStr = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;
  const toWin = profitIfWon(bet.stake, bet.odds).toFixed(2);

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-muted">
              {bet.sport}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass[bet.status]}`}>
              {bet.status.toUpperCase()}
            </span>
            {bet.isPublic && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">PUBLIC</span>
            )}
          </div>
          <h3 className="font-semibold mt-1.5 truncate">{bet.event}</h3>
          <p className="text-accent font-medium text-sm mt-0.5">{bet.selection}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono font-semibold">{oddsStr}</div>
          <div className="text-xs text-muted mt-0.5">
            {bet.stake}u · to win {toWin}u
          </div>
        </div>
      </div>

      {(bet.book || bet.notes) && (
        <div className="text-xs text-muted border-t border-card-border pt-2">
          {bet.book && <span>{bet.book}</span>}
          {bet.book && bet.notes && " · "}
          {bet.notes}
        </div>
      )}

      {showActions && (
        <div className="flex flex-wrap gap-2 border-t border-card-border pt-3">
          {(["pending", "won", "lost", "push"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange?.(bet.id, s)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                bet.status === s
                  ? "border-accent text-accent bg-accent/10"
                  : "border-card-border text-muted hover:border-muted"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => onTogglePublic?.(bet.id)}
            className="text-xs px-2.5 py-1 rounded-md border border-card-border text-muted hover:border-accent hover:text-accent ml-auto"
          >
            {bet.isPublic ? "Unshare" : "Share"}
          </button>
          <button
            onClick={() => onDelete?.(bet.id)}
            className="text-xs px-2.5 py-1 rounded-md border border-danger/40 text-danger hover:bg-danger/10"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
