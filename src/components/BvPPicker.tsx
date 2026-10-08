"use client";

import { useState } from "react";
import type { BatterLine } from "@/lib/mlb";
import type { BvP } from "@/lib/propdesk";
import type { HitterLog } from "@/lib/hitter-form";
import { PitcherZones } from "@/components/PitcherZones";

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
  const [menu, setMenu] = useState(false);

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
  const vsPitcherId = openSide === "away" ? homePitcherId : awayPitcherId;
  const vsPitcherName = openSide === "away" ? homePitcherName : awayPitcherName;
  const sideName = openSide === "away" ? awayTeam : homeTeam;
  const showing = picked?.side === sideName ? picked : null;

  return (
    <div className="card space-y-3 p-4">
      <div>
        <h3 className="text-sm font-semibold">Batter vs starter</h3>
        <p className="mt-1 text-xs text-muted">One hitter at a time. Zone, then career against this starter, then the last 5.</p>
      </div>
      <div className="flex gap-2">
        {([["away", awayTeam], ["home", homeTeam]] as const).map(([side, label]) => (
          <button key={side} type="button" onClick={() => { setOpenSide(side); setMenu(false); }} className={`min-h-11 flex-1 rounded-full px-3 text-sm ${openSide === side ? "bg-accent text-background" : "bg-background text-muted"}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_148px] items-start gap-2">
        <div>
          <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-background px-3 py-2 text-left">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{showing ? showing.name : "Choose a batter"}</span>
              <span className="text-xs text-muted">
                {showing
                  ? `${showing.avg} · ${showing.hr} HR · vs ${showing.vsName}`
                  : `${list.length} hitters`}
              </span>
            </span>
            <span className="text-sm text-muted">{menu ? "Close" : "Open"}</span>
          </button>
          {menu ? (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-background p-1">
              {list.map((b) => (
                <li key={`${b.side}-${b.id}`}>
                  <button type="button" onClick={() => { setMenu(false); tap(b); }} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left ${picked?.id === b.id ? "bg-accent/20" : ""}`}>
                    <span className="min-w-0 truncate text-sm font-medium">{b.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted">{b.avg} · {b.hr} HR</span>
                  </button>
                </li>
              ))}
              {list.length === 0 ? <li className="px-2 py-3 text-xs text-muted">No hitters loaded for this side.</li> : null}
            </ul>
          ) : null}
        </div>
        <PitcherZones id={vsPitcherId} name={vsPitcherName || "Starter"} />
      </div>
      <div className="space-y-2 border-t border-card-border pt-3">
        <p className="text-xs uppercase tracking-widest text-muted">Career vs {vsPitcherName || "the starter"}</p>
        {loading ? <p className="text-xs text-muted">Loading matchup…</p> : null}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        {showing && bvp ? (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat k="AB" v={bvp.ab} />
            <Stat k="H" v={bvp.h} />
            <Stat k="HR" v={bvp.hr} />
            <Stat k="SO" v={bvp.so} />
            <Stat k="AVG" v={bvp.avg} />
            <Stat k="OPS" v={bvp.ops} />
          </div>
        ) : null}
        {showing && !loading && !bvp && !error ? <p className="text-xs text-muted">No career sample vs this pitcher.</p> : null}
        {!showing ? <p className="text-xs text-muted">Open the list and pick a batter.</p> : null}
        <p className="text-xs uppercase tracking-widest text-muted">Last five</p>
        {showing && form && form.games.length > 0 ? (
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide text-muted">Last 5 · {form.l5h}/{form.l5ab} · {form.l5hr} HR</div>
            <div className="flex gap-2">
              {form.games.map((g) => (
                <div key={g.date} className="min-w-14 flex-1 rounded-xl bg-background py-2 text-center">
                  <div className="font-mono text-sm">{g.h}/{g.ab}</div>
                  <div className="text-[10px] text-muted">{g.hr ? `${g.hr} HR` : g.date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
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
