import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { getPitcherLogs, lsPitcherRating, projectKs } from "./propdesk";

function clamp(n: number, lo = 52, hi = 91) {
  return Math.round(Math.min(hi, Math.max(lo, n)));
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

  const aK = awayP?.k9 || 7.5;
  const hK = homeP?.k9 || 7.5;
  const aEra = awayP?.era || 4.2;
  const hEra = homeP?.era || 4.2;
  const homeKpct = homeT?.kPct || 22;
  const awayKpct = awayT?.kPct || 22;
  const homeOps = parseFloat(homeT?.ops || ".700");
  const awayOps = parseFloat(awayT?.ops || ".700");

  const awayProjK = projectKs(aK, homeKpct);
  const homeProjK = projectKs(hK, awayKpct);
  const awayLS = awayP ? lsPitcherRating(aK, homeKpct, aEra, awayLogs.reduce((s, x) => s + x.k, 0)) : 55;
  const homeLS = homeP ? lsPitcherRating(hK, awayKpct, hEra, homeLogs.reduce((s, x) => s + x.k, 0)) : 55;

  const homeBetter = hEra + 0.15 < aEra || homeLS > awayLS + 4;
  const mlTeam = homeBetter ? g.homeTeam : g.awayTeam;
  const ace = homeBetter ? homeP : awayP;
  const dog = homeBetter ? awayP : homeP;
  const aceLogs = homeBetter ? homeLogs : awayLogs;
  const mlScore = clamp(58 + Math.abs(aEra - hEra) * 10 + Math.abs(homeLS - awayLS) * 0.25);
  edges.push({
    gamePk: g.gamePk,
    game,
    market: "Moneyline",
    pick: `${mlTeam} ML`,
    edgeScore: mlScore,
    pitcher: ace?.name,
    reasoning: `${ace?.name || "The sharper starter"} holds a ${ace?.era ?? "?"} ERA and ${ace?.k9 ?? "?"} K/9 against ${dog?.name || "the other arm"} (${dog?.era ?? "?"} ERA). LS ${homeLS} vs ${awayLS}.`,
    stats: {
      "L5 hit rate": aceLogs.length
        ? `Ace L5 starts: ${aceLogs.map((x) => `${x.k}K/${x.er}ER`).join(" · ")}`
        : "No L5 starter log",
    },
  });

  const combEra = (aEra + hEra) / 2;
  const combK = (homeKpct + awayKpct) / 2;
  const combOps = (homeOps + awayOps) / 2;
  const under = combEra <= 3.85 || combK >= 23;
  const totScore = clamp(56 + Math.abs(3.9 - combEra) * 12 + Math.abs(combK - 22) * 1.4);
  edges.push({
    gamePk: g.gamePk,
    game,
    market: "Game Total",
    pick: under ? "Under runs" : "Over runs",
    edgeScore: totScore,
    reasoning: under
      ? `Combined ERA ${combEra.toFixed(2)}, lineup K% ${combK.toFixed(1)}. Under environment.`
      : `Combined ERA ${combEra.toFixed(2)}, OPS ${combOps.toFixed(3)}. Over environment.`,
    stats: {
      "L5 hit rate": `Home SP L5 ER: ${homeLogs.map((x) => x.er).join("-") || "—"} · Away SP L5 ER: ${awayLogs.map((x) => x.er).join("-") || "—"}`,
    },
  });

  const kSideHome = homeProjK >= awayProjK;
  const kPitcher = kSideHome ? homeP : awayP;
  const kLogs = kSideHome ? homeLogs : awayLogs;
  const kProj = kSideHome ? homeProjK : awayProjK;
  const kOpp = kSideHome ? awayT : homeT;
  const kScore = clamp(60 + ((kPitcher?.k9 || 8) - 7.2) * 6 + ((kOpp?.kPct || 22) - 21) * 1.6);
  if (kPitcher) {
    const overProj = kLogs.filter((x) => x.k >= Math.floor(kProj)).length;
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kPitcher.name} strikeouts (proj ${kProj})`,
      edgeScore: kScore,
      pitcher: kPitcher.name,
      reasoning: `${kPitcher.name} ${kPitcher.k9} K/9 into ${kOpp?.kPct}% K lineup. Proj ${kProj} Ks.`,
      stats: {
        "L5 hit rate": kLogs.length
          ? `${overProj}/${kLogs.length} starts at or above ${Math.floor(kProj)} K · L5: ${kLogs.map((x) => x.k).join("-")} K`
          : "No L5 log",
      },
    });
  }
  return edges;
}
