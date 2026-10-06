import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { getPitcherLogs, projectKs } from "./propdesk";
import { grade } from "./confidence";
import { lessonLine } from "./calibrate";
import type { StartLog } from "./propdesk";
import type { MlbLine } from "./mlb-odds";
import { bullpen } from "./pen";

function lastVs(logs: StartLog[], abbr?: string) {
  if (!abbr) return null;
  return logs.find((x) => x.opp.toUpperCase() === abbr.toUpperCase()) || null;
}

function logLine(logs: StartLog[]) {
  if (!logs.length) return "no last-5 log loaded";
  return logs.map((x) => `${x.date.slice(5) || "?"} vs ${x.opp} ${x.ip} IP ${x.k}K ${x.h}H ${x.bb}BB ${x.er}ER`).join("; ");
}

function priceOf(raw?: string) {
  const n = parseFloat(String(raw || "").replace("+", ""));
  return Number.isFinite(n) ? n : null;
}

type Bats = { hits: number; ab: number; runs: number; avg: number };

async function recentBats(teamId: number): Promise<Bats | null> {
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=gameLog&group=hitting&season=2026&sportId=1`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const rows = (data.stats?.[0]?.splits || []).slice(-5);
  if (!rows.length) return null;
  const hits = rows.reduce((s: number, r: { stat?: { hits?: number } }) => s + (r.stat?.hits || 0), 0);
  const ab = rows.reduce((s: number, r: { stat?: { atBats?: number } }) => s + (r.stat?.atBats || 0), 0);
  const runs = rows.reduce((s: number, r: { stat?: { runs?: number } }) => s + (r.stat?.runs || 0), 0);
  return { hits, ab, runs, avg: ab ? hits / ab : 0 };
}

function registry(aligns: string[], misses: string[]) {
  let score = 40 + aligns.length * 7 - misses.length * 6;
  if (aligns.length >= 4 && misses.length === 0) score += 4;
  if (aligns.length < 3) score = Math.min(score, 64);
  if (misses.length >= 2) score = Math.min(score, 62);
  return Math.max(36, Math.min(64, Math.round(score)));
}

export async function alwaysCard(
  g: GameMatchup,
  homeP: PitcherStats | null,
  awayP: PitcherStats | null,
  homeT: TeamKStats | null,
  awayT: TeamKStats | null,
  line?: MlbLine | null
): Promise<Edge[]> {
  const game = `${g.awayTeam} @ ${g.homeTeam}`;
  const edges: Edge[] = [];
  const [homeLogs, awayLogs, homeBats, awayBats, homePen, awayPen] = await Promise.all([
    homeP ? getPitcherLogs(homeP.id) : Promise.resolve([]),
    awayP ? getPitcherLogs(awayP.id) : Promise.resolve([]),
    recentBats(g.homeId),
    recentBats(g.awayId),
    bullpen(g.homeId),
    bullpen(g.awayId),
  ]);

  const pack = (
    p: PitcherStats | null,
    logs: StartLog[],
    opp: TeamKStats | null,
    oppAbbr?: string
  ) => {
    if (!p) return null;
    const last = logs[0];
    const vs = lastVs(logs, oppAbbr);
    const proj = projectKs(p.k9, opp?.kPct || 22);
    const overProj = logs.filter((x) => x.k >= Math.floor(proj)).length;
    const confirms: string[] = [];
    const flags: string[] = [];
    if (p.k9 >= 9.5) confirms.push(`${p.k9} K/9`);
    if ((opp?.kPct || 0) >= 23.5) confirms.push(`${opp?.name || "opp"} K% ${opp?.kPct}`);
    if (p.avgAgainst > 0 && p.avgAgainst <= 0.21) confirms.push(`AVG against ${p.avgAgainst.toFixed(3)}`);
    if (p.whip > 0 && p.whip <= 1.15) confirms.push(`WHIP ${p.whip}`);
    if (logs.length >= 4 && overProj >= 4) confirms.push(`cleared ${Math.floor(proj)} K in ${overProj}/${logs.length} of last starts`);
    if (p.era > 0 && p.era <= 3.2) confirms.push(`ERA ${p.era}`);
    if (last && last.h >= 6) flags.push(`last start ${last.h} H in ${last.ip} vs ${last.opp}`);
    if (last && last.bb >= 4) flags.push(`last start ${last.bb} BB vs ${last.opp}`);
    if (vs && vs.h >= 6) flags.push(`last look at ${vs.opp}: ${vs.h} H in ${vs.ip}`);
    if (p.avgAgainst >= 0.23) flags.push(`season AVG against ${p.avgAgainst.toFixed(3)}`);
    if (p.whip >= 1.28) flags.push(`WHIP ${p.whip}`);
    if (logs.length >= 3) {
      const avgH = logs.reduce((s, x) => s + x.h, 0) / logs.length;
      if (avgH >= 5) flags.push(`L5 average ${avgH.toFixed(1)} H per start`);
    }
    return { p, logs, opp, proj, overProj, last, vs, ...grade(confirms, flags), confirms, flags };
  };

  const home = pack(homeP, homeLogs, awayT, g.awayAbbr);
  const away = pack(awayP, awayLogs, homeT, g.homeAbbr);
  const sides = [
    { key: "home" as const, team: g.homeTeam, arm: home, bats: homeT, hot: homeBats, pen: homePen, price: priceOf(line?.mlHome), raw: line?.mlHome },
    { key: "away" as const, team: g.awayTeam, arm: away, bats: awayT, hot: awayBats, pen: awayPen, price: priceOf(line?.mlAway), raw: line?.mlAway },
  ];

  const ranked = sides
    .map((s) => {
      const other = s.key === "home" ? sides[1] : sides[0];
      const aligns: string[] = [];
      const misses: string[] = [];
      if (s.arm?.p && other.arm?.p && s.arm.p.era + 0.4 < other.arm.p.era) aligns.push(`starter ERA ${s.arm.p.era} vs ${other.arm.p.era}`);
      if (s.arm?.p && s.arm.p.whip > 0 && s.arm.p.whip <= 1.15) aligns.push(`starter WHIP ${s.arm.p.whip}`);
      if (s.arm && s.arm.flags.length === 0 && s.arm.logs.length >= 3) aligns.push("starter last 5 has no contact or walk flag");
      if (s.bats && parseFloat(s.bats.ops) >= 0.74) aligns.push(`season OPS ${s.bats.ops}`);
      if (s.hot && s.hot.ab >= 20 && s.hot.avg >= 0.27) aligns.push(`hot bats ${s.hot.hits}-for-${s.hot.ab} (${s.hot.avg.toFixed(3)}) and ${s.hot.runs} runs over the last 5`);
      if (s.hot && s.hot.runs >= 25) aligns.push(`last 5 scoring ${s.hot.runs} runs`);
      if (s.pen && s.pen.era > 0 && s.pen.era <= 3.6) aligns.push(`bullpen ERA ${s.pen.era} over ${s.pen.ip} IP`);
      if (s.price != null && s.price < 0) misses.push(`posted favorite ${s.raw} is a price, not a path`);
      misses.push("weather not loaded");
      if (other.arm?.p && other.arm.p.era < 3.4 && other.arm.flags.length === 0) misses.push(`${other.arm.p.name} is also a live arm (${other.arm.p.era} ERA)`);
      if (s.hot && s.hot.ab >= 20 && s.hot.avg < 0.22) misses.push(`bats cold ${s.hot.hits}-for-${s.hot.ab} over the last 5`);
      if (s.pen && s.pen.era >= 4.4) misses.push(`bullpen ERA ${s.pen.era} can give a lead back`);
      if (other.pen && s.pen && other.pen.era + 0.5 < s.pen.era) misses.push(`other bullpen ${other.pen.era} ERA is the better pen`);
      if (s.arm && s.arm.flags.length >= 2) misses.push(`starter flags: ${s.arm.flags.slice(0, 2).join("; ")}`);
      if (s.price != null && s.price > 0 && aligns.length < 3) misses.push(`posted ${s.raw} and the registry is not stacked`);
      return { ...s, other, aligns, misses, score: registry(aligns, misses) };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (best?.arm?.p || best?.bats) {
    const against = best.misses.length
      ? `Not aligned: ${best.misses.join("; ")}.`
      : "Nothing in the registry is pointing the other way.";
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Moneyline",
      pick: `${best.team} ML`,
      edgeScore: best.score,
      pitcher: best.arm?.p.name,
      reasoning: `Registry for ${best.team}: ${best.aligns.join("; ") || "nothing stacked"}. ${best.arm?.p ? `${best.arm.p.name} ${best.arm.p.era} ERA / ${best.arm.p.whip} WHIP. ` : ""}${best.other.arm?.p ? `Other arm ${best.other.arm.p.name} ${best.other.arm.p.era} ERA. ` : ""}Pens ${g.awayTeam} ${awayPen?.era ?? "n/a"} / ${g.homeTeam} ${homePen?.era ?? "n/a"}. Posted ${line?.mlAway || "—"}/${line?.mlHome || "—"}. ${against} A favorite price cannot print a 70. ${lessonLine("Moneyline")} Score ${best.score}.`,
      stats: {
        Aligns: best.aligns.length,
        Misses: best.misses.length,
        "L5 bats": best.hot ? `${best.hot.hits}/${best.hot.ab}, ${best.hot.runs} R` : "n/a",
        Bullpen: best.pen ? `${best.pen.era} ERA` : "n/a",
      },
    });
  }

  const combEra = ((awayP?.era || 4.2) + (homeP?.era || 4.2)) / 2;
  const combK = ((homeT?.kPct || 22) + (awayT?.kPct || 22)) / 2;
  const under = combEra <= 3.85 || combK >= 23;
  const totConfirms: string[] = [];
  const totFlags: string[] = [];
  if (combEra <= 3.5) totConfirms.push(`combined starter ERA ${combEra.toFixed(2)}`);
  if (combK >= 24) totConfirms.push(`combined lineup K% ${combK.toFixed(1)}`);
  if ((home?.flags.length || 0) + (away?.flags.length || 0) >= 2) totFlags.push("both starters already showed contact or walks in L5");
  if ((homeBats?.runs || 0) + (awayBats?.runs || 0) >= 45) totFlags.push("both lineups have been scoring");
  if ((homePen?.era || 0) >= 4.4 && (awayPen?.era || 0) >= 4.4) totFlags.push("both bullpens are over 4.40 ERA");
  const tot = grade(totConfirms, totFlags);
  const totAgainst = totFlags.length
    ? `Case against: ${totFlags.join("; ")}.`
    : under
      ? `Case against: playoff lineups hunt and one bad inning flips an under.`
      : `Case against: if either starter lasts five clean, the over is dead.`;
  edges.push({
    gamePk: g.gamePk,
    game,
    market: "Game Total",
    pick: under ? "Under runs" : "Over runs",
    edgeScore: Math.min(64, tot.score),
    reasoning: `${g.awayPitcher || "Away SP"} ERA ${awayP?.era ?? "?"}, L5 ER ${awayLogs.map((x) => x.er).join("-") || "n/a"}. ${g.homePitcher || "Home SP"} ERA ${homeP?.era ?? "?"}, L5 ER ${homeLogs.map((x) => x.er).join("-") || "n/a"}. Lineups: ${g.awayTeam} K% ${awayT?.kPct ?? "?"} / OPS ${awayT?.ops ?? "?"}; ${g.homeTeam} K% ${homeT?.kPct ?? "?"} / OPS ${homeT?.ops ?? "?"}. Last 5 runs ${awayBats?.runs ?? "?"} / ${homeBats?.runs ?? "?"}. Bullpens ${awayPen?.era ?? "?"} / ${homePen?.era ?? "?"}. Combined ERA ${combEra.toFixed(2)}. ${totAgainst} Weather is not in this card. Score ${Math.min(64, tot.score)}.`,
    stats: { "Home L5 ER": homeLogs.map((x) => x.er).join("-") || "—", "Away L5 ER": awayLogs.map((x) => x.er).join("-") || "—" },
  });

  const kSide = (home?.p?.k9 || 0) >= (away?.p?.k9 || 0) ? home : away;
  if (kSide?.p && kSide.flags.length === 0 && kSide.confirms.length >= 2 && kSide.p.avgAgainst < 0.23) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kSide.p.name} strikeouts (proj ${kSide.proj})`,
      edgeScore: kSide.score,
      pitcher: kSide.p.name,
      reasoning: `${kSide.p.name} ${kSide.p.k9} K/9, ${kSide.p.era} ERA into ${kSide.opp?.name || "the other lineup"} (${kSide.opp?.kPct ?? "?"}% K, ${kSide.opp?.avg ?? "?"} AVG). Projected ${kSide.proj} Ks. Last 5: ${logLine(kSide.logs)}. Hit rate vs that projection: ${kSide.overProj}/${kSide.logs.length || 0}. Case against: projected ${kSide.proj} Ks is a model, not a book number. If he is pulled at 80 pitches the over is dead. ${lessonLine("Pitcher Ks")} Score ${kSide.score}.`,
      stats: {
        "L5 hit rate": kSide.logs.length
          ? `${kSide.overProj}/${kSide.logs.length} starts at or above ${Math.floor(kSide.proj)} K · ${kSide.logs.map((x) => `${x.k}K/${x.h}H`).join("-")}`
          : "No L5 log",
      },
    });
  }
  return edges;
}
