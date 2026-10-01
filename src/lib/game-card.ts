import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { getPitcherLogs, projectKs } from "./propdesk";
import { grade } from "./confidence";
import { lessonLine } from "./calibrate";
import type { StartLog } from "./propdesk";
import type { MlbLine } from "./mlb-odds";

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
  const [homeLogs, awayLogs] = await Promise.all([
    homeP ? getPitcherLogs(homeP.id) : Promise.resolve([]),
    awayP ? getPitcherLogs(awayP.id) : Promise.resolve([]),
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

  const ace = (home?.score || 0) >= (away?.score || 0) ? home : away;
  const dog = ace === home ? away : home;
  if (ace?.p) {
    const sideHome = ace === home;
    const oppEra = dog?.p?.era ?? 9;
    const eraGap = oppEra - ace.p.era;
    const posted = sideHome ? line?.mlHome : line?.mlAway;
    const price = priceOf(posted);
    const mlFlags = [...ace.flags];
    if (oppEra < 4) mlFlags.push(`other starter ERA ${oppEra} is not a soft arm`);
    if (eraGap < 1.25) mlFlags.push(`ERA gap only ${eraGap.toFixed(2)}`);
    if (price != null && price > 0) mlFlags.push(`posted ${posted}, market does not agree`);
    const ml = grade(
      [
        eraGap >= 1.25 ? `ERA gap ${eraGap.toFixed(2)}` : "",
        oppEra >= 4.2 ? `other arm ERA ${oppEra}` : "",
        price != null && price < 0 ? `posted favorite ${posted}` : "",
      ].filter(Boolean),
      mlFlags
    );
    let score = ml.score;
    if (oppEra < 4 || eraGap < 1.25 || (price != null && price > 0)) score = Math.min(score, 58);
    else score = Math.min(score, 74);
    const against = mlFlags.length
      ? `Case against: ${mlFlags.join("; ")}. That is why this is not a 70.`
      : `Case against: one starter line is not a side.`;
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Moneyline",
      pick: `${sideHome ? g.homeTeam : g.awayTeam} ML`,
      edgeScore: score,
      pitcher: ace.p.name,
      reasoning: `${ace.p.name} (${ace.p.era} ERA, ${ace.p.k9} K/9, ${ace.p.whip} WHIP) vs ${dog?.p?.name || "TBD"}${dog?.p ? ` (${dog.p.era} ERA, ${dog.p.k9} K/9)` : ""}. Posted ML ${line?.mlAway || "—"}/${line?.mlHome || "—"}. ${against} ${lessonLine("Moneyline")} Score ${score}.`,
      stats: { "L5 hit rate": ace.logs.map((x) => `${x.k}K/${x.h}H/${x.bb}BB`).join(" · ") || "—" },
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
    edgeScore: tot.score,
    reasoning: `${g.awayPitcher || "Away SP"} ERA ${awayP?.era ?? "?"}, L5 ER ${awayLogs.map((x) => x.er).join("-") || "n/a"}. ${g.homePitcher || "Home SP"} ERA ${homeP?.era ?? "?"}, L5 ER ${homeLogs.map((x) => x.er).join("-") || "n/a"}. Lineups: ${g.awayTeam} K% ${awayT?.kPct ?? "?"} / OPS ${awayT?.ops ?? "?"}; ${g.homeTeam} K% ${homeT?.kPct ?? "?"} / OPS ${homeT?.ops ?? "?"}. Combined ERA ${combEra.toFixed(2)}. ${totAgainst} Score ${tot.score}.`,
    stats: { "Home L5 ER": homeLogs.map((x) => x.er).join("-") || "—", "Away L5 ER": awayLogs.map((x) => x.er).join("-") || "—" },
  });

  const kSide = (home?.p?.k9 || 0) >= (away?.p?.k9 || 0) ? home : away;
  if (kSide?.p && kSide.flags.length === 0 && kSide.confirms.length >= 2 && kSide.p.avgAgainst < 0.23) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kSide.p.name} strikeouts (proj ${kSide.proj})`,
      edgeScore: Math.min(kSide.score, 66),
      pitcher: kSide.p.name,
      reasoning: `${kSide.p.name} ${kSide.p.k9} K/9, ${kSide.p.era} ERA into ${kSide.opp?.name || "the other lineup"} (${kSide.opp?.kPct ?? "?"}% K, ${kSide.opp?.avg ?? "?"} AVG). Projected ${kSide.proj} Ks. Last 5: ${logLine(kSide.logs)}. Hit rate vs that projection: ${kSide.overProj}/${kSide.logs.length || 0}. Case against: projected ${kSide.proj} Ks is a model, not a book number. If he is pulled at 80 pitches the over is dead. ${lessonLine("Pitcher Ks")} Score ${Math.min(kSide.score, 66)}.`,
      stats: {
        "L5 hit rate": kSide.logs.length
          ? `${kSide.overProj}/${kSide.logs.length} starts at or above ${Math.floor(kSide.proj)} K · ${kSide.logs.map((x) => `${x.k}K/${x.h}H`).join("-")}`
          : "No L5 log",
      },
    });
  }
  return edges;
}
