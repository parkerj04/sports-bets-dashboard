"use client";

import { useEffect, useMemo, useState } from "react";
import { Stadium } from "@/components/Stadium";

type Side = { zonePct: number; manPct: number; snaps: number } | null;
type Play = { week: string; def: string; loc: string; length: string; air: number | null; yards: number | null; td: boolean; desc: string; qtr?: string; time?: string; from?: string; to?: string; x?: number | null };
type Catcher = { name: string; team: string; rec: number; yards: number; td: number; recent: Play[] };
type Back = { name: string; team: string; role: string; carries: number; rushYards: number; rec: number; recYards: number; thirdShare: number; left: number; middle: number; right: number; recent: { week: string; def: string; loc: string; yards: number | null; down: string; togo: string; td: boolean }[] };

function scoreWeight(p: Catcher) {
  const endZone = (p.recent || []).filter((c) => (c.x || 0) >= 80 || c.td).length;
  return p.td * 10 + endZone * 2 + p.yards / 100;
}
function matchup(p: Catcher, opp: string, def: Side) {
  const vs = (p.recent || []).filter((c) => c.def === opp);
  const vsYards = vs.reduce((s, c) => s + (c.yards || 0), 0);
  const short = (p.recent || []).filter((c) => c.length !== "deep").length;
  const deep = (p.recent || []).filter((c) => c.length === "deep").length;
  const zone = def?.zonePct ?? 55;
  return vsYards * 3 + p.yards + (zone >= 60 ? short * 4 : deep * 6);
}

export function CoverageSplit({ away, home, venue }: { away: string; home: string; venue?: string }) {
  const [data, setData] = useState<{ source: string; away: Side; home: Side; catches: Catcher[] } | null>(null);
  const [backs, setBacks] = useState<Back[]>([]);
  const [side, setSide] = useState(away);
  const [picked, setPicked] = useState("");
  const [backName, setBackName] = useState("");
  useEffect(() => {
    if (!away || !home) return;
    fetch(`/api/research/nfl/coverage?away=${away}&home=${home}`).then((r) => r.json()).then((d) => {
      setData(d);
      const first = (d.catches || []).find((p: Catcher) => p.team === away) || d.catches?.[0];
      setPicked(first?.name || "");
      setSide(first?.team || away);
    }).catch(() => setData(null));
    fetch(`/api/research/nfl/backs?away=${away}&home=${home}`).then((r) => r.json()).then((d) => {
      setBacks(d.players || []);
      setBackName(d.players?.[0]?.name || "");
    }).catch(() => setBacks([]));
  }, [away, home]);
  const list = useMemo(() => (data?.catches || []).filter((p) => p.team === side), [data, side]);
  const backList = useMemo(() => backs.filter((p) => p.team === side), [backs, side]);
  const opp = side === away ? home : away;
  const def = side === away ? data?.home : data?.away;
  const plus = useMemo(() => [...list].sort((a, b) => matchup(b, opp, def || null) - matchup(a, opp, def || null))[0], [list, opp, def]);
  const star = useMemo(() => [...list].sort((a, b) => scoreWeight(b) - scoreWeight(a))[0], [list]);
  if (!data) return <p className="text-xs text-muted">Loading 2026 catches…</p>;
  const active = list.find((p) => p.name === picked) || list[0];
  const back = backList.find((p) => p.name === backName) || backList[0];
  const heavy = (s: Side) => (s && s.zonePct >= 65 ? "zone-heavy" : s && s.zonePct <= 50 ? "man-leaning" : "mixed");
  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Matchup</h3>
        <div className="flex gap-1 rounded-full bg-background p-1">
          {[away, home].map((t) => (
            <button key={t} type="button" onClick={() => { setSide(t); setPicked(""); setBackName(""); }} className={`min-h-11 rounded-full px-3 text-sm ${side === t ? "bg-accent text-foreground" : "text-muted"}`}>{t}</button>
          ))}
        </div>
      </div>
      <p className="text-xs" style={{ color: "#f0eee6" }}>
        {star && star.recent?.length ? `★ ${star.name} is the best path. Named in the 2026 catch chart: end-zone spots and scores.` : "No star. The catch chart does not name a best path."}
        {plus && plus.recent?.length ? ` + ${plus.name} is the best yardage matchup. Named against ${opp} in that same chart.` : ""}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.map((p) => (
          <button key={p.name} type="button" onClick={() => setPicked(p.name)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${active?.name === p.name ? "bg-accent text-foreground" : "bg-background text-muted"}`}>
            {p.name === plus?.name && plus.recent?.length ? "+ " : ""}{p.name === star?.name && star.recent?.length ? "★ " : ""}{p.name}
          </button>
        ))}
      </div>
      {active ? (
        <Stadium venue={venue} home={home} away={away} team={active.team} name={active.name} rec={active.rec} plays={active.recent || []} />
      ) : (
        <p className="text-sm text-muted">No 2026 catches loaded for {side}.</p>
      )}
      <div>
        <h3 className="font-semibold">Backs</h3>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {backList.map((p) => (
            <button key={p.name} type="button" onClick={() => setBackName(p.name)} className={`min-h-11 shrink-0 rounded-full px-3 text-sm ${back?.name === p.name ? "bg-accent text-foreground" : "bg-background text-muted"}`}>{p.name}</button>
          ))}
          {backList.length === 0 && <p className="text-sm text-muted">No back with 3 carries for {side}.</p>}
        </div>
        {back && (
          <p className="mt-2 font-mono text-xs text-muted">{back.carries} car, {back.rushYards} rush · {back.rec} rec, {back.recYards} yds · {back.left} left, {back.middle} middle, {back.right} right</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <SideCard name={away} side={data.away} tag={heavy(data.away)} />
        <SideCard name={home} side={data.home} tag={heavy(data.home)} />
      </div>
    </div>
  );
}

function SideCard({ name, side, tag }: { name: string; side: Side; tag: string }) {
  if (!side) return <div className="bg-white/5 rounded-lg p-2">{name}: no 2025 chart</div>;
  return (
    <div className="rounded-xl bg-background p-3">
      <div className="font-medium">{name} defense</div>
      <div className="mt-1 font-mono">{side.zonePct}% zone</div>
      <div className="font-mono">{side.manPct}% man</div>
      <div className="mt-1 text-muted">{tag} · {side.snaps} snaps · 2025</div>
    </div>
  );
}
