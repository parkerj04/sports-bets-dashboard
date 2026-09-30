"use client";

import { useState } from "react";
import { Bet, Sport } from "@/lib/types";

const SPORTS: Sport[] = [
  "NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "Soccer", "UFC", "Tennis", "Golf", "Other",
];

interface Props {
  onAdd: (bet: Omit<Bet, "id" | "placedAt">) => void;
}

export function AddBetForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState<Sport>("NFL");
  const [event, setEvent] = useState("");
  const [selection, setSelection] = useState("");
  const [odds, setOdds] = useState("-110");
  const [stake, setStake] = useState("1");
  const [book, setBook] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  function reset() {
    setEvent("");
    setSelection("");
    setOdds("-110");
    setStake("1");
    setBook("");
    setNotes("");
    setIsPublic(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const oddsNum = Number(odds);
    const stakeNum = Number(stake);
    if (!event.trim() || !selection.trim() || isNaN(oddsNum) || isNaN(stakeNum) || stakeNum <= 0) {
      return;
    }
    onAdd({
      sport,
      event: event.trim(),
      selection: selection.trim(),
      odds: oddsNum,
      stake: stakeNum,
      book: book.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "pending",
      isPublic,
    });
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
      >
        <span className="text-lg leading-none">+</span> Add Bet
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New Bet</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-muted text-sm hover:text-foreground">
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Sport</label>
          <select className="input" value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Odds (American)</label>
          <input className="input" value={odds} onChange={(e) => setOdds(e.target.value)} placeholder="-110" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Event</label>
        <input className="input" value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Chiefs vs Bills" required />
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Selection</label>
        <input className="input" value={selection} onChange={(e) => setSelection(e.target.value)} placeholder="Chiefs -3.5" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted mb-1 block">Stake (units)</label>
          <input className="input" type="number" step="0.1" min="0.1" value={stake} onChange={(e) => setStake(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Book (optional)</label>
          <input className="input" value={book} onChange={(e) => setBook(e.target.value)} placeholder="DraftKings" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted mb-1 block">Notes (optional)</label>
        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sharp side, weather, etc." />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-card-border"
        />
        Show on public plays page
      </label>

      <button type="submit" className="btn-primary w-full py-2.5 text-sm">
        Place Bet
      </button>
    </form>
  );
}
