"use client";

import { useMemo, useState } from "react";
import type { BatterLine } from "@/lib/mlb";
import type { BvP } from "@/lib/propdesk";
import type { HitterLog } from "@/lib/hitter-form";
import { BatterZones } from "@/components/PitcherZones";

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
  const homeOptions = useMemo(
    () => homeHitters.map((b) => ({ ...b, vsId: awayPitcherId, vsName: awayPitcherName, side: homeTeam })),
    [homeHitters, awayPitcherId, awayPitcherName, homeTeam]
  );
  const awayOptions = useMemo(
    () => awayHitters.map((b) => ({ ...b, vsId: homePitcherId, vsName: homePitcherName, side: awayTeam })),
    [awayHitters, homePitcherId, homePitcherName, awayTeam]
  );
  const all = [...awayOptions, ...homeOptions].filter((b) => b.id && b.vsId);

  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [bvp, setBvp] = useState<BvP | null>(null);
  const [form, setForm] = useState<HitterLog | null>(null);
  const [error, setError] = useState("");

  async function load(val: string) {
    setKey(val);
    setError("");
    setBvp(null);
    setForm(null);
    const row = all.find((b) => String(b.id) === val);
    if (!row || !row.vsId) return;
    setLoading(true);
    const res = await fetch(
      `/api/research/bvp?batterId=${row.id}&pitcherId=${row.vsId}&name=${encodeURIComponent(row.name)}`
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load matchup");
      return;
    }
    setBvp(data.bvp);
    setForm(data.form);
  }

  const selected = all.find((b) => String(b.id) === key);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Pick any batter vs the starter</h3>
      <select className="input" value={key} onChange={(e) => load(e.target.value)}>
        <option value="">Select a hitter…</option>
        <optgroup label={awayTeam}>
          {awayOptions.filter((b) => b.vsId).map((b) => (
            <option key={`a${b.id}`} value={b.id}>
              {b.name} vs {homePitcherName || "home SP"}
            </option>
          ))}
        </optgroup>
        <optgroup label={homeTeam}>
          {homeOptions.filter((b) => b.vsId).map((b) => (
            <option key={`h${b.id}`} value={b.id}>
              {b.name} vs {awayPitcherName || "away SP"}
            </option>
          ))}
        </optgroup>
      </select>
      {loading && <p className="text-xs text-muted">Loading matchup…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
      {selected && !loading && (
        <p className="text-xs text-muted">
          {selected.name} vs {selected.vsName} ({selected.avg} / {selected.ops} season)
        </p>
      )}
      {bvp ? (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Stat k="AB" v={bvp.ab} />
          <Stat k="H" v={bvp.h} />
          <Stat k="HR" v={bvp.hr} />
          <Stat k="SO" v={bvp.so} />
          <Stat k="AVG" v={bvp.avg} />
          <Stat k="OPS" v={bvp.ops} />
        </div>
      ) : (
        key && !loading && <p className="text-xs text-muted">No career sample vs this pitcher yet.</p>
      )}
      {form && form.games.length > 0 && (
        <p className="text-xs font-mono text-muted">
          L5: {form.l5h}/{form.l5ab} · {form.l5hr} HR · {form.games.map((g) => `${g.h}/${g.ab}`).join(" · ")}
        </p>
      )}
      {selected && <BatterZones id={selected.id} name={selected.name} />}
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
