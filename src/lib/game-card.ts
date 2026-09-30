import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { getPitcherLogs, projectKs } from "./propdesk";
import { grade } from "./confidence";
import type { StartLog } from "./propdesk";

function lastVs(logs: StartLog[], abbr?: string) {
  if (!abbr) return null;
  return logs.find((x) => x.opp.toUpperCase() === abbr.toUpperCase()) || null;
}

function logLine(logs: StartLog[]) {
  if (!logs.length) return "no last-5 log loaded";
  return logs.map((x) => `${x.date.slice(5) || "?"} vs ${x.opp} ${x.ip} IP ${x.k}K ${x.h}H ${x.bb}BB ${x.er}ER`).join("; ");
}

export async function alwaysCard(
  g: GameMatchup,
  homeP: PitcherStats | null,
  awayP: PitcherStats | null,
  homeT: TeamKStats | null,
  awayT: TeamKStats | null
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
    const against =
      ace.flags.length > 0
        ? `Case against: ${ace.flags.join("; ")}. That is why this is not an 80.`
        : dog?.p
          ? `Case against: ${dog.p.name} is not a soft arm (${dog.p.era} ERA, ${dog.p.k9} K/9). One wild-card start is a small sample.`
          : "Case against: starter still has to throw the game.";
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Moneyline",
      pick: `${ace === home ? g.homeTeam : g.awayTeam} ML`,
      edgeScore: ace.score,
      pitcher: ace.p.name,
      reasoning: `${ace.p.name} (${ace.p.era} ERA, ${ace.p.k9} K/9, ${ace.p.whip} WHIP, AVG against ${ace.p.avgAgainst.toFixed(3)}) vs ${dog?.p?.name || "TBD"}${dog?.p ? ` (${dog.p.era} ERA, ${dog.p.k9} K/9, ${dog.p.whip} WHIP)` : ""}. ${ace.p.name} last 5: ${logLine(ace.logs)}. ${against} Score ${ace.score} from ${ace.confirms.length} confirm${ace.confirms.length === 1 ? "" : "s"}${ace.confirms.length ? ` (${ace.confirms.join(", ")})` : ""}.`,
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
  if (kSide?.p && kSide.flags.length === 0 && kSide.confirms.length >= 2) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kSide.p.name} strikeouts (proj ${kSide.proj})`,
      edgeScore: kSide.score,
      pitcher: kSide.p.name,
      reasoning: `${kSide.p.name} ${kSide.p.k9} K/9, ${kSide.p.era} ERA into ${kSide.opp?.name || "the other lineup"} (${kSide.opp?.kPct ?? "?"}% K, ${kSide.opp?.avg ?? "?"} AVG). Projected ${kSide.proj} Ks. Last 5: ${logLine(kSide.logs)}. Hit rate vs that projection: ${kSide.overProj}/${kSide.logs.length || 0}. Case against: projected ${kSide.proj} Ks is a model, not a book number. If he is pulled at 80 pitches the over is dead. Score ${kSide.score}.`,
      stats: {
        "L5 hit rate": kSide.logs.length
          ? `${kSide.overProj}/${kSide.logs.length} starts at or above ${Math.floor(kSide.proj)} K · ${kSide.logs.map((x) => `${x.k}K/${x.h}H`).join("-")}`
          : "No L5 log",
      },
    });
  }
  return edges;
}
