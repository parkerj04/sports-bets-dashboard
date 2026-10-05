const ABBR: Record<string, string> = {
  cardinals: "ARI", falcons: "ATL", ravens: "BAL", bills: "BUF", panthers: "CAR", bears: "CHI", bengals: "CIN", browns: "CLE",
  cowboys: "DAL", broncos: "DEN", lions: "DET", packers: "GB", texans: "HOU", colts: "IND", jaguars: "JAX", chiefs: "KC",
  raiders: "LV", chargers: "LAC", rams: "LAR", dolphins: "MIA", vikings: "MIN", patriots: "NE", saints: "NO", giants: "NYG",
  jets: "NYJ", eagles: "PHI", steelers: "PIT", "49ers": "SF", seahawks: "SEA", buccaneers: "TB", titans: "TEN", commanders: "WSH",
  irish: "ND", dame: "ND", heels: "UNC", carolina: "UNC", hawkeyes: "IOWA", buckeyes: "OSU", gators: "FLA", tigers: "MIZ",
  wolves: "NCSU", hokies: "VT", cavaliers: "UVA", eaglescfb: "BC",
  yankees: "NYY", sox: "BOS", rays: "TB", guardians: "CLE", twins: "MIN", royals: "KC",
  orioles: "BAL", "white sox": "CWS", astros: "HOU", mariners: "SEA", rangers: "TEX", angels: "LAA",
  athletics: "ATH", braves: "ATL", mets: "NYM", phillies: "PHI", marlins: "MIA", nationals: "WSH",
  cubs: "CHC", brewers: "MIL", reds: "CIN", pirates: "PIT", dodgers: "LAD", padres: "SD",
  giants: "SF", diamondbacks: "AZ", rockies: "COL",
};

function tag(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const last = clean.split(" ").filter(Boolean).pop() || clean;
  if (ABBR[last]) return ABBR[last];
  if (clean.length <= 4) return clean.toUpperCase();
  return last.slice(0, 4).toUpperCase();
}

export function ModelCall({ away, home, spread, total, sport }: { away: string; home: string; spread: string; total: string | number; sport?: string }) {
  const ou = typeof total === "number" ? total : parseFloat(String(total));
  if (!ou) return <p className="text-xs text-muted">No posted total, so there is no model score.</p>;
  const raw = String(spread || "");
  const matched = raw.match(/-?\d+(?:\.\d+)?/);
  const parsed = matched ? parseFloat(matched[0]) : 0;
  const text = raw.toLowerCase();
  const homeToken = home.toLowerCase().split(" ").pop() || "";
  const awayToken = away.toLowerCase().split(" ").pop() || "";
  const homeFav = text.includes(homeToken) ? parsed < 0 || text.includes("-") : text.includes(awayToken) ? false : parsed < 0;
  const baseball = sport === "MLB" || ou < 14;
  const line = baseball ? (Math.abs(parsed) > 4 ? 1.5 : Math.abs(parsed) || 1.5) : Math.abs(parsed);
  let homeScore = Math.round(homeFav ? (ou + line) / 2 : (ou - line) / 2);
  let awayScore = Math.round(ou - homeScore);
  if (baseball) {
    homeScore = Math.max(0, homeScore);
    awayScore = Math.max(0, awayScore);
    if (homeScore + awayScore === 0) {
      homeScore = homeFav ? 3 : 1;
      awayScore = homeFav ? 1 : 3;
    }
  }
  const confidence = baseball ? (line >= 1.5 ? 54 : 51) : line >= 14 ? 64 : line >= 7 ? 58 : line >= 3 ? 54 : 51;
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
      <p className="text-[11px] text-muted mt-1">{baseball ? "Run score from the posted total. A moneyline is not a run line." : "Straight score from the posted number. Not a private model."}</p>
    </div>
  );
}
