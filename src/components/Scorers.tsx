"use client";

import { useEffect, useState } from "react";

type Week = { week: number; td: number; opp: string };
type Scorer = { name: string; team: string; pos: string; id: string; total: number; scored: number; weeks: Week[] };

function read(p: Scorer) {
  const n = p.weeks.length;
  const spike = Math.max(...p.weeks.map((w) => w.td));
  const against = spike > 1 && spike * 2 > p.total
    ? `One game was ${spike} of the ${p.total} scores.`
    : p.scored < n
      ? `No score in ${n - p.scored} of ${n} logged games.`
      : `${n} games. A full streak on a short log is not a price.`;
  const call = n < 3 ? "Pass — short log" : p.scored === n ? "Scored every logged game" : p.scored * 2 >= n ? "No clear edge" : "More misses than scores";
  return { call, against };
}

export function Scorers({ away, home }: { away: string; home: string }) {
  const [players, setPlayers] = useState<Scorer[] | null>(null);
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [side, setSide] = useState(away);

  useEffect(() => {
    if (!away || !home) return;
    setPlayers(null);
    fetch(`/api/research/nfl/scorers?away=${away}&home=${home}`)
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players || []);
        setSource(d.source || "");
        const first = (d.players || []).find((p: Scorer) => p.team === away) || d.players?.[0];
        setName(first?.name || "");
        setSide(first?.team || away);
      })
      .catch(() => setPlayers([]));
  }, [away, home]);

  if (!players) return <p className="text-xs text-muted">Loading scorers…</p>;
  const list = players.filter((p) => p.team === side);
  const active = list.find((p) => p.name === name) || list[0];
  const note = active ? read(active) : null;
  const max = active ? Math.max(1, ...active.weeks.map((w) => w.td)) : 1;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Anytime scorer</h2>
        <div className="flex gap-1 rounded-full bg-background p-1">
          {[away, home].map((t) => (
            <button key={t} type="button" onClick={() => { setSide(t); setName(""); }} className={`min-h-11 rounded-full px-3 text-sm ${side === t ? "bg-accent text-foreground" : "text-muted"}`}>{t}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? <p className="mt-3 text-sm text-muted">No 2026 rushing or receiving touchdown on file for {side}.</p> : null}
      <ul className="mt-3">
        {list.map((p) => (
          <li key={p.name}>
            <button type="button" onClick={() => setName(p.name)} className={`flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left ${active?.name === p.name ? "bg-background" : ""}`}>
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-card">
                {p.id ? <img src={`https://a.espncdn.com/i/headshots/nfl/players/full/${p.id}.png`} alt="" className="size-full object-cover object-top" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="text-xs text-muted">{p.pos}</span>
              </span>
              <span className="flex gap-1">
                {p.weeks.map((w) => (
                  <span key={w.week} className={`size-3 rounded-sm ${w.td > 0 ? "bg-good" : "bg-card-border"}`} title={`Week ${w.week}`} />
                ))}
              </span>
              <span className="w-12 text-right font-mono text-sm">{p.total} in {p.weeks.length}</span>
            </button>
          </li>
        ))}
      </ul>
      {active && note ? (
        <div className="mt-3 rounded-xl bg-background p-3">
          <div className="text-sm font-medium">{active.name}</div>
          <p className="text-sm text-muted">Scored in {active.scored} of {active.weeks.length} logged games. {note.call}.</p>
          <div className="mt-3 flex h-24 items-end gap-3">
            {active.weeks.map((w) => (
              <div key={w.week} className="flex flex-1 flex-col items-center justify-end">
                <span className="font-mono text-xs">{w.td}</span>
                <div className="mt-1 w-full rounded-t bg-good" style={{ height: `${Math.max(w.td ? 8 : 2, (w.td / max) * 64)}px` }} />
                <span className="mt-1 text-[10px] text-muted">W{w.week}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{note.against}</p>
        </div>
      ) : null}
      <p className="mt-3 text-xs text-muted">{source}</p>
    </section>
  );
}
