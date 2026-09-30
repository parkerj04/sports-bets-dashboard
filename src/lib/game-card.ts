import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";
import { projectKs, lsPitcherRating } from "./propdesk";

function clamp(n: number, lo = 52, hi = 91) {
  return Math.round(Math.min(hi, Math.max(lo, n)));
}

export function alwaysCard(
  g: GameMatchup,
  homeP: PitcherStats | null,
  awayP: PitcherStats | null,
  homeT: TeamKStats | null,
  awayT: TeamKStats | null
): Edge[] {
  const game = `${g.awayTeam} @ ${g.homeTeam}`;
  const edges: Edge[] = [];

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
  const awayLS = awayP ? lsPitcherRating(aK, homeKpct, aEra, 8) : 55;
  const homeLS = homeP ? lsPitcherRating(hK, awayKpct, hEra, 8) : 55;

  const homeBetter = (hEra + 0.15) < aEra || homeLS > awayLS + 4;
  const mlTeam = homeBetter ? g.homeTeam : g.awayTeam;
  const ace = homeBetter ? homeP : awayP;
  const dog = homeBetter ? awayP : homeP;
  const mlScore = clamp(58 + Math.abs(aEra - hEra) * 10 + Math.abs(homeLS - awayLS) * 0.25);
  edges.push({
    gamePk: g.gamePk,
    game,
    market: "Moneyline",
    pick: `${mlTeam} ML`,
    edgeScore: mlScore,
    pitcher: ace?.name,
    reasoning: `${ace?.name || "The sharper starter"} holds a ${ace?.era ?? "?"} ERA and ${ace?.k9 ?? "?"} K/9 against ${dog?.name || "the other arm"} (${dog?.era ?? "?"} ERA, ${dog?.k9 ?? "?"} K/9). LS ratings ${homeLS} vs ${awayLS}. Confidence ${mlScore}: the starter gap is the cleanest ML signal we have without a paid model.`,
    stats: { "Home ERA": hEra, "Away ERA": aEra, "Home LS": homeLS, "Away LS": awayLS },
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
      ? `Combined starter ERA ${combEra.toFixed(2)} and lineup K% ${combK.toFixed(1)}. That is a suppress-contact environment. Confidence ${totScore}: unders hit when both arms miss bats and neither offense is a .800 OPS club (here ${combOps.toFixed(3)}).`
      : `Combined starter ERA ${combEra.toFixed(2)} with combined OPS ${combOps.toFixed(3)}. Contact should leak. Confidence ${totScore}: overs when ERAs sit over ~3.9 and both lineups still do damage.`,
    stats: { "Comb ERA": combEra.toFixed(2), "Comb K%": combK.toFixed(1), "Comb OPS": combOps.toFixed(3) },
  });

  const kSideHome = homeProjK >= awayProjK;
  const kPitcher = kSideHome ? homeP : awayP;
  const kProj = kSideHome ? homeProjK : awayProjK;
  const kOpp = kSideHome ? awayT : homeT;
  const kScore = clamp(60 + ((kPitcher?.k9 || 8) - 7.2) * 6 + ((kOpp?.kPct || 22) - 21) * 1.6);
  if (kPitcher) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Pitcher Ks",
      pick: `${kPitcher.name} strikeouts (proj ${kProj})`,
      edgeScore: kScore,
      pitcher: kPitcher.name,
      reasoning: `${kPitcher.name} is a ${kPitcher.k9} K/9 arm into a ${kOpp?.kPct}% K lineup. Model projects ${kProj} Ks over ~5.8 IP (K/9 ÷ 9 × innings, scaled by lineup K% vs 22% league). Confidence ${kScore}: this is the most modelable prop on the slate — punchout rate is stable and the lineup adjustment is the whole edge.`,
      stats: { "K/9": kPitcher.k9, "Opp K%": `${kOpp?.kPct}%`, "Proj K": kProj },
    });
  }

  return edges;
}
