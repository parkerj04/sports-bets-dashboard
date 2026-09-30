import type { Edge, GameMatchup, PitcherStats, TeamKStats } from "./mlb";

export function gameMarketEdges(
  g: GameMatchup,
  homeP: PitcherStats | null,
  awayP: PitcherStats | null,
  homeT: TeamKStats | null,
  awayT: TeamKStats | null
): Edge[] {
  const edges: Edge[] = [];
  const game = `${g.awayTeam} @ ${g.homeTeam}`;
  if (!homeP || !awayP || !homeT || !awayT) return edges;

  const combinedEra = (homeP.era + awayP.era) / 2;
  const combinedK = (homeT.kPct + awayT.kPct) / 2;
  const combinedOps = (parseFloat(homeT.ops) + parseFloat(awayT.ops)) / 2;

  const underScore = Math.round(
    20 + Math.max(0, 3.6 - combinedEra) * 18 + Math.max(0, combinedK - 21) * 2.5
  );
  const overScore = Math.round(
    20 + Math.max(0, combinedEra - 3.8) * 16 + Math.max(0, combinedOps - 0.7) * 80
  );

  if (underScore >= overScore && underScore >= 40) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Game Total",
      pick: "Under runs",
      edgeScore: Math.min(90, underScore),
      reasoning: `Both starters check in at ${awayP.era} and ${homeP.era} ERA. Combined opponent K% is ${combinedK.toFixed(1)}%. Lean under unless weather/lineups scream otherwise.`,
      stats: { "SP ERAs": `${awayP.era} / ${homeP.era}`, "Comb K%": combinedK.toFixed(1), "Comb OPS": combinedOps.toFixed(3) },
    });
  } else if (overScore >= 40) {
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Game Total",
      pick: "Over runs",
      edgeScore: Math.min(90, overScore),
      reasoning: `Starter ERAs ${awayP.era} and ${homeP.era} with combined OPS ${combinedOps.toFixed(3)}. Contact and damage tilt the total over.`,
      stats: { "SP ERAs": `${awayP.era} / ${homeP.era}`, "Comb OPS": combinedOps.toFixed(3), "Comb K%": combinedK.toFixed(1) },
    });
  }

  const gap = awayP.era - homeP.era;
  if (Math.abs(gap) >= 0.6) {
    const homeBetter = gap > 0;
    const team = homeBetter ? g.homeTeam : g.awayTeam;
    const ace = homeBetter ? homeP : awayP;
    const other = homeBetter ? awayP : homeP;
    edges.push({
      gamePk: g.gamePk,
      game,
      market: "Moneyline",
      pick: `${team} ML`,
      edgeScore: Math.min(88, Math.round(45 + Math.abs(gap) * 12)),
      reasoning: `${ace.name} (${ace.era} ERA, ${ace.k9} K/9) is the clearer starter vs ${other.name} (${other.era} ERA). Lean ${team} on the moneyline if the price is not wild.`,
      stats: { "Ace ERA": ace.era, "Other ERA": other.era, "Ace K/9": ace.k9 },
    });
  }
  return edges;
}
