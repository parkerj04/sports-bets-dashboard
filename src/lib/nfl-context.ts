import { impliedTotals, type Check, type Ticket } from "./ticket";
import type { NflLab } from "./nfl-game";
import type { NflGame } from "./nfl";

const KEY = /QB|quarterback|WR|receiver|RB|running back|TE |tackle|edge|corner|CB /i;

export function nflTicket(card: NflGame, lab?: NflLab | null): Ticket {
  const imp = impliedTotals(card.total, card.spread, card.home, card.away);
  const inj = lab?.injuries || [];
  const keyOut = inj.filter((i) => /out|doubtful|ir/i.test(i.status) && KEY.test(`${i.name} ${i.desc} ${i.status}`));
  const qbCloud = inj.filter((i) => /QB|quarterback/i.test(`${i.name} ${i.desc}`) && /out|doubtful|questionable/i.test(i.status));
  const checks: Check[] = [
    { id: "injury", label: "Injury / role", ok: keyOut.length === 0 ? (inj.length ? true : null) : false, detail: keyOut.length ? keyOut.map((i) => `${i.name} ${i.status}`).join("; ") : inj.length ? "no key OUT/DOUBTFUL in this feed" : "open the lab closer to kick" },
    { id: "qb", label: "QB confirmed", ok: qbCloud.length ? false : true, detail: qbCloud.length ? qbCloud.map((i) => `${i.name} ${i.status}`).join("; ") : "no QB flag in this feed" },
    { id: "line", label: "Number", ok: card.spread !== "NL", detail: `${card.spread} · O/U ${card.total} · ML ${card.mlAway}/${card.mlHome}` },
    { id: "script", label: "Implied totals", ok: Boolean(imp), detail: imp ? `${card.away} ${imp.awayImp} / ${card.home} ${imp.homeImp} (game ${imp.total})` : "no total posted" },
    { id: "sample", label: "Usage / scheme", ok: true, detail: "coverage and 2026 scheme charts are on the lab — last-3 snap share still needs the inactive list" },
    { id: "weather", label: "Weather", ok: /dome|sofi|ford field|super dome|lucas oil|nrg|att stadium|caesars|allegiant/i.test(card.venue) ? true : null, detail: /dome|sofi|ford field|super dome|lucas oil|nrg|att stadium|caesars|allegiant/i.test(card.venue) ? "indoor-ish — weather is not the bet" : "re-check wind/rain day-of if outdoor" },
    { id: "against", label: "Case against written", ok: true, detail: "required" },
  ];
  return {
    sport: "NFL",
    game: `${card.away} at ${card.home}`,
    checks,
    script: imp ? `implied ${card.away} ${imp.awayImp}, ${card.home} ${imp.homeImp}` : "no implied total",
    market: `${card.spread} / ${card.total}`,
    notes: [
      "Referee is a last check, not a side.",
      "Do not bet a 72 built on records if a QB is questionable.",
    ],
  };
}
