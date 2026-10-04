const ABBR: Record<string, string> = {
  cardinals: "ARI", falcons: "ATL", ravens: "BAL", bills: "BUF", panthers: "CAR", bears: "CHI", bengals: "CIN", browns: "CLE",
  cowboys: "DAL", broncos: "DEN", lions: "DET", packers: "GB", texans: "HOU", colts: "IND", jaguars: "JAX", chiefs: "KC",
  raiders: "LV", chargers: "LAC", rams: "LAR", dolphins: "MIA", vikings: "MIN", patriots: "NE", saints: "NO", giants: "NYG",
  jets: "NYJ", eagles: "PHI", steelers: "PIT", "49ers": "SF", seahawks: "SEA", buccaneers: "TB", titans: "TEN", commanders: "WSH",
  irish: "ND", dame: "ND", heels: "UNC", carolina: "UNC", hawkeyes: "IOWA", buckeyes: "OSU", gators: "FLA", tigers: "MIZ",
  wolves: "NCSU", hokies: "VT", cavaliers: "UVA", eaglescfb: "BC",
};

function tag(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const last = clean.split(" ").filter(Boolean).pop() || clean;
  if (ABBR[last]) return ABBR[last];
  if (clean.length <= 4) return clean.toUpperCase();
  return last.slice(0, 4).toUpperCase();
}

export function ModelCall({ away, home, spread, total }: { away: string; home: string; spread: string; total: string | number }) {
  const ou = typeof total === "number" ? total : parseFloat(String(total));
  if (!ou) return <p className="text-xs text-muted">No posted total, so there is no model score.</p>;
  const raw = String(spread || "");
  const line = Math.abs(parseFloat((raw.match(/-?\d+(?:\.\d+)?/) || ["0"])[0]));
  const homeToken = home.toLowerCase().split(" ").pop() || "";
  const awayToken = away.toLowerCase().split(" ").pop() || "";
  const text = raw.toLowerCase();
  const homeFav = text.includes(homeToken) ? text.includes("-") : text.includes(awayToken) ? false : text.trim().startsWith("-");
  const homeScore = Math.round(homeFav ? (ou + line) / 2 : (ou - line) / 2);
  const awayScore = Math.round(ou - homeScore);
  const confidence = line >= 14 ? 64 : line >= 7 ? 58 : line >= 3 ? 54 : 51;
  return (
    <div className="rounded-lg border border-card-border bg-white/5 px-3 py-2 text-xs">
      <div className="flex justify-between gap-2">
        <span className="text-muted">Model score</span>
        <span className="font-mono font-semibold">{tag(away)} {awayScore} {tag(home)} {homeScore}</span>
      </div>
      <div className="flex justify-between gap-2 mt-1">
        <span className="text-muted">Model total</span>
        <span className="font-mono">{awayScore + homeScore}</span>
      </div>
      <div className="flex justify-between gap-2 mt-1">
        <span className="text-muted">Confidence</span>
        <span className="font-mono">{confidence}</span>
      </div>
      <p className="text-[11px] text-muted mt-1">Straight score from the posted number. Not a private model.</p>
    </div>
  );
}
