"use client";

import { useMemo } from "react";

type Final = { away: number; home: number };

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(mean: number, sd: number, rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function poisson(lambda: number, rng: () => number) {
  if (lambda <= 0) return 0;
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > limit && k < 40);
  return k - 1;
}

function readLine(spread: string, totalRaw: string | number, homeTag: string, awayTag: string, home: string, away: string) {
  const total = typeof totalRaw === "number" ? totalRaw : parseFloat(String(totalRaw));
  if (!Number.isFinite(total) || total <= 0) return null;
  const text = String(spread || "").toLowerCase();
  const matched = text.match(/-?\d+(?:\.\d+)?/);
  const n = matched ? parseFloat(matched[0]) : 0;
  const abs = Math.abs(n);
  const homeHit = text.includes(homeTag.toLowerCase()) || text.includes((home.split(" ").pop() || "home").toLowerCase());
  const awayHit = text.includes(awayTag.toLowerCase()) || text.includes((away.split(" ").pop() || "away").toLowerCase());
  let homeSpread = n;
  if (homeHit && !awayHit) homeSpread = -abs;
  else if (awayHit && !homeHit) homeSpread = abs;
  const homeImp = Math.max(0, total / 2 - homeSpread / 2);
  const awayImp = Math.max(0, total - homeImp);
  return { total, homeSpread, homeImp, awayImp };
}

function draw(sport: "NFL" | "MLB", homeImp: number, awayImp: number, rng: () => number): Final {
  if (sport === "MLB") return { away: poisson(awayImp, rng), home: poisson(homeImp, rng) };
  const margin = normal(homeImp - awayImp, 13.5, rng);
  const sum = Math.max(0, normal(homeImp + awayImp, 10, rng));
  return {
    home: Math.max(0, Math.round((sum + margin) / 2)),
    away: Math.max(0, Math.round((sum - margin) / 2)),
  };
}

export function SimHundred({
  sport,
  away,
  home,
  awayTag,
  homeTag,
  spread,
  total,
  seed,
}: {
  sport: "NFL" | "MLB";
  away: string;
  home: string;
  awayTag: string;
  homeTag: string;
  spread: string;
  total: string | number;
  seed: string;
}) {
  const report = useMemo(() => {
    const line = readLine(spread, total, homeTag, awayTag, home, away);
    if (!line) return null;
    const rng = mulberry32(hash(`${seed}|${sport}`));
    const games: Final[] = [];
    for (let i = 0; i < 100; i++) games.push(draw(sport, line.homeImp, line.awayImp, rng));
    let homeCover = 0;
    let awayCover = 0;
    let over = 0;
    let under = 0;
    let homeWin = 0;
    let awayWin = 0;
    let ties = 0;
    let close = 0;
    const scores = new Map<string, number>();
    let homeSum = 0;
    let awaySum = 0;
    for (const g of games) {
      const margin = g.home - g.away;
      const graded = margin + line.homeSpread;
      if (graded > 0) homeCover += 1;
      else if (graded < 0) awayCover += 1;
      const points = g.home + g.away;
      if (points > line.total) over += 1;
      else if (points < line.total) under += 1;
      if (g.home > g.away) homeWin += 1;
      else if (g.away > g.home) awayWin += 1;
      else ties += 1;
      if (sport === "NFL" ? Math.abs(margin) <= 8 : Math.abs(margin) === 1) close += 1;
      const key = `${awayTag} ${g.away} ${homeTag} ${g.home}`;
      scores.set(key, (scores.get(key) || 0) + 1);
      homeSum += g.home;
      awaySum += g.away;
    }
    const top = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return {
      homeCover,
      awayCover,
      over,
      under,
      homeWin,
      awayWin,
      ties,
      close,
      top,
      avgAway: (awaySum / 100).toFixed(1),
      avgHome: (homeSum / 100).toFixed(1),
      total: line.total,
      note: sport === "NFL"
        ? "One run of 100, tied to this game. Each draw uses the posted spread with a 13.5-point swing and the posted total with a 10-point swing. It does not get redrawn. It is the market shaken up, not a scouting report."
        : "One run of 100, tied to this game. Each team’s runs are a Poisson draw at its implied total from the posted number. It does not get redrawn. It does not know the lineup or the umpire.",
    };
  }, [sport, away, home, awayTag, homeTag, spread, total, seed]);

  if (!report) return null;
  const closeLabel = sport === "NFL" ? "One score" : "One run";
  const tiles = [
    { n: report.homeCover, label: `${homeTag} covers` },
    { n: report.awayCover, label: `${awayTag} covers` },
    { n: report.over, label: `Over ${report.total}` },
    { n: report.close, label: closeLabel },
  ];
  const lead = report.top[0];

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">100 sims</p>
          <h2 className="mt-1 font-semibold">One run, from the posted number</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl bg-background px-3 py-3">
            <div className="font-mono text-2xl font-semibold">{t.n}</div>
            <div className="text-xs text-muted">{t.label}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm">
        {lead ? <p>Most common final was {lead[0]}, and it came up {lead[1]} {lead[1] === 1 ? "time" : "times"}.</p> : null}
        {report.top.slice(1).map(([line, n]) => (
          <p key={line} className="text-muted">{line} came up {n} {n === 1 ? "time" : "times"}.</p>
        ))}
        <p className="text-muted">{homeTag} won {report.homeWin}. {awayTag} won {report.awayWin}{report.ties ? `. ${report.ties} tied` : ""}. Average final was {awayTag} {report.avgAway}, {homeTag} {report.avgHome}. The under hit {report.under}.</p>
      </div>
      <p className="text-xs text-muted">{report.note}</p>
    </section>
  );
}
