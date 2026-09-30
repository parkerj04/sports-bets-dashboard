import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { getPitcherLogs, projectKs } from "./propdesk";
import { grade } from "./confidence";
import type { StartLog } from "./propdesk";

function lastVs(logs: StartLog[], abbr?: string) {
  if (!abbr) return null;
  return logs.find((x) => x.opp.toUpperCase() === abbr.toUpperCase()) || null;
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
    if ((opp?.kPct || 0) >= 23.5) confirms.push(`opp K% ${opp?.kPct}`);
    if (p.avgAgainst > 0 && p.avgAgainst <= 0.21) confirms.push(`AVG against ${p.avgAgainst.toFixed(3)}`);
    if (p.whip > 0 && p.whip <= 1.15) confirms.push(`WHIP ${p.whip}`);
    if (logs.length >= 4 && overProj >= 4) confirms.push(`L5 K hit rate ${overProj}/${logs.length} vs proj ${proj}`);
    if (p.era > 0 && p.era <= 3.2) confirms.push(`ERA ${p.era}`);
    if (last && last.h >= 6) flags.push(`last start ${last.h} H in ${last.ip}`);
    if (last && last.bb >= 4) flags.push(`last start ${last.bb} BB`);
    if (vs && vs.h >= 6) flags.push(`last vs ${vs.opp}: ${vs.h} H`);
    if (p.avgAgainst >= 0.23) flags.push(`season AVG against ${p.avgAgainst.toFixed(3)}`);
    if (p.whip >= 1.28) flags.push(`WHIP ${p.whip}`);
    if (logs.length >= 3) {
      const avgH = logs.reduce((s, x) => s + x.h, 0) / logs.length;
      if (avgH >= 5) flags.push(`L5 avg ${avgH.toFixed(1)} H/start`);
    }
    return { p, logs, opp, proj, overProj, ...grade(confirms, flags), confirms, flags };
  };

  const home = pack(homeP, homeLogs, awayT, g.awayAbbr);
  const away = pack(awayP, awayLogs, homeT, g.homeAbbr);

  const ace = (home?.score || 0) >= (away?.score || 0) ? home : away;
  const dog = ace === home ? away : home;
  if (ace?.p) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Moneyline",
      pick: `${ace === home ? g.homeTeam : g.awayTeam} ML`,
      edgeScore: ace.score,
      pitcher: ace.p.name,
      reasoning: `${ace.p.name} vs ${dog?.p?.name || "the other starter"}. ${ace.why}`,
      stats: {
        "L5 hit rate": ace.logs.map((x) => `${x.k}K/${x.h}H/${x.bb}BB`).join(" · ") || "—",
      },
    });
  }

  const combEra = ((awayP?.era || 4.2) + (homeP?.era || 4.2)) / 2;
  const combK = ((homeT?.kPct || 22) + (awayT?.kPct || 22)) / 2;
  const totConfirms: string[] = [];
  const totFlags: string[] = [];
  if (combEra <= 3.5) totConfirms.push(`combined ERA ${combEra.toFixed(2)}`);
  if (combK >= 24) totConfirms.push(`combined K% ${combK.toFixed(1)}`);
  if ((home?.flags.length || 0) + (away?.flags.length || 0) >= 2) totFlags.push("both starters have contact/walk flags");
  const tot = grade(totConfirms, totFlags);
  edges.push({
    gamePk: g.gamePk,
    game,
    market: "Game Total",
    pick: combEra <= 3.85 || combK >= 23 ? "Under runs" : "Over runs",
    edgeScore: tot.score,
    reasoning: tot.why,
    stats: { "Home L5 ER": homeLogs.map((x) => x.er).join("-") || "—", "Away L5 ER": awayLogs.map((x) => x.er).join("-") || "—" },
  });

  const kSide = (home?.p?.k9 || 0) >= (away?.p?.k9 || 0) ? home : away;
  if (kSide?.p) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kSide.p.name} strikeouts (proj ${kSide.proj})`,
      edgeScore: kSide.score,
      pitcher: kSide.p.name,
      reasoning: `${kSide.p.name} ${kSide.p.k9} K/9 into ${kSide.opp?.kPct ?? "?"}% K lineup. ${kSide.why}`,
      stats: {
        "L5 hit rate": kSide.logs.length
          ? `${kSide.overProj}/${kSide.logs.length} starts at or above ${Math.floor(kSide.proj)} K · L5: ${kSide.logs.map((x) => `${x.k}K/${x.h}H`).join("-")}`
          : "No L5 log",
      },
    });
  }
  return edges;
}
