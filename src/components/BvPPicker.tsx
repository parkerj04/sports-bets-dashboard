"use client";

import { useState } from "react";
import type { BatterLine } from "@/lib/mlb";
import type { BvP } from "@/lib/propdesk";
import type { HitterLog } from "@/lib/hitter-form";
import { BatterZones } from "@/components/PitcherZones";

type Opt = BatterLine & { vsId?: number | null; vsName?: string | null; side: string };

export function BvPPicker({
  homeHitters,
  awayHitters,
  homePitcherId,
  awayPitcherId,
  homePitcherName,
  awayPitcherName,
  homeTeam,
  awayTeam,
}: {
  homeHitters: BatterLine[];
  awayHitters: BatterLine[];
  homePitcherId?: number | null;
  awayPitcherId?: number | null;
  homePitcherName?: string | null;
  awayPitcherName?: string | null;
  homeTeam: string;
  awayTeam: string;
}) {
  const awayOptions: Opt[] = (awayHitters || []).map((b) => ({
    ...b,
    vsId: homePitcherId || null,
    vsName: homePitcherName || "home starter",
    side: awayTeam,
  }));
  const homeOptions: Opt[] = (homeHitters || []).map((b) => ({
    ...b,
    vsId: awayPitcherId || null,
    vsName: awayPitcherName || "away starter",
    side: homeTeam,
  }));

  const [picked, setPicked] = useState<Opt | null>(null);
  const [loading, setLoading] = useState(false);
  const [bvp, setBvp] = useState<BvP | null>(null);
  const [form, setForm] = useState<HitterLog | null>(null);
  const [error, setError] = useState("");
  const [openSide, setOpenSide] = useState<"away" | "home">("away");

  async function tap(row: Opt) {
    setPicked(row);
    setError("");
    setBvp(null);
    setForm(null);
    if (!row.id || !row.vsId) {
      setError("No starter ID for this matchup yet.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/research/bvp?batterId=${row.id}&pitcherId=${row.vsId}&name=${encodeURIComponent(row.name)}`
      );
      const data = await res.json();
      if (!res.ok) setError(data.error || "Could not load matchup");
      else {
        setBvp(data.bvp || null);
        setForm(data.form || null);
      }
    } catch {
      setError("Network error loading matchup");
    } finally {
      setLoading(false);
    }
  }

  const list = openSide === "away" ? awayOptions : homeOptions;

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick any batter vs the starter</h3>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpenSide("away")} className={`text-xs px-3 py-1.5 rounded-full border ${openSide === "away" ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{awayTeam}</button>
        <button type="button" onClick={() => setOpenSide("home")} className={`text-xs px-3 py-1.5 rounded-full border ${openSide === "home" ? "border-accent text-accent bg-accent/10" : "border-card-border text-muted"}`}>{homeTeam}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((b) => (
          <button
            type="button"
            key={`${b.side}-${b.id}`}
            onClick={() => tap(b)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border ${picked?.id === b.id && picked?.side === b.side ? "border-accent text-accent bg-accent/10" : "border-card-border"}`}
          >
            {b.name}
          </button>
        ))}
        {list.length === 0 && <p className="text-xs text-muted">No hitters loaded for this side.</p>}
      </div>
      {picked && (
        <p className="text-xs text-muted">
          {picked.name} vs {picked.vsName} · season {picked.avg} / {picked.ops}
        </p>
      )}
      {loading && <p className="text-xs text-muted">Loading matchup…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
      {bvp && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Stat k="AB" v={bvp.ab} />
          <Stat k="H" v={bvp.h} />
          <Stat k="HR" v={bvp.hr} />
          <Stat k="SO" v={bvp.so} />
          <Stat k="AVG" v={bvp.avg} />
          <Stat k="OPS" v={bvp.ops} />
        </div>
      )}
      {picked && !loading && !bvp && !error && (
        <p className="text-xs text-muted">No career sample vs this pitcher.</p>
      )}
      {form && form.games.length > 0 && (
        <p className="text-xs font-mono text-muted">
          L5: {form.l5h}/{form.l5ab} · {form.l5hr} HR · {form.games.map((g) => `${g.h}/${g.ab}`).join(" · ")}
        </p>
      )}
      {picked && <BatterZones id={picked.id} name={picked.name} />}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="bg-white/5 rounded-lg py-2">
      <div className="text-muted">{k}</div>
      <div className="font-mono font-semibold">{v}</div>
    </div>
  );
}
