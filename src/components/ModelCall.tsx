const ABBR: Record<string, string> = {
  cardinals: "ARI", falcons: "ATL", ravens: "BAL", bills: "BUF", panthers: "CAR", bears: "CHI", bengals: "CIN", browns: "CLE",
  cowboys: "DAL", broncos: "DEN", lions: "DET", packers: "GB", texans: "HOU", colts: "IND", jaguars: "JAX", chiefs: "KC",
  raiders: "LV", chargers: "LAC", rams: "LAR", dolphins: "MIA", vikings: "MIN", patriots: "NE", saints: "NO",
  jets: "NYJ", eagles: "PHI", steelers: "PIT", "49ers": "SF", seahawks: "SEA", buccaneers: "TB", titans: "TEN", commanders: "WSH",
  irish: "ND", dame: "ND", heels: "UNC", carolina: "UNC", hawkeyes: "IOWA", buckeyes: "OSU", gators: "FLA", tigers: "MIZ",
  wolves: "NCSU", hokies: "VT", cavaliers: "UVA", eaglescfb: "BC",
  yankees: "NYY", sox: "BOS", rays: "TB", guardians: "CLE", twins: "MIN", royals: "KC",
  orioles: "BAL", "white sox": "CWS", astros: "HOU", mariners: "SEA", rangers: "TEX", angels: "LAA",
  athletics: "ATH", braves: "ATL", mets: "NYM", phillies: "PHI", marlins: "MIA", nationals: "WSH",
  cubs: "CHC", brewers: "MIL", reds: "CIN", pirates: "PIT", dodgers: "LAD", padres: "SD",
  diamondbacks: "AZ", rockies: "COL",
};

function tag(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  if (clean.endsWith("giants")) return clean.includes("san francisco") ? "SF" : "NYG";
  const last = clean.split(" ").filter(Boolean).pop() || clean;
  if (ABBR[last]) return ABBR[last];
  if (clean.length <= 4) return clean.toUpperCase();
  return last.slice(0, 4).toUpperCase();
}

function readModel(away: string, home: string, spread: string, total: string | number, sport?: string) {
  const ou = typeof total === "number" ? total : parseFloat(String(total));
  if (!ou) return null;
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
  return { baseball, awayTag: tag(away), homeTag: tag(home), awayScore, homeScore, total: awayScore + homeScore, confidence };
}

export function ModelCall({ away, home, spread, total, sport }: { away: string; home: string; spread: string; total: string | number; sport?: string }) {
  const model = readModel(away, home, spread, total, sport);
  if (!model) return <p className="text-xs text-muted">No posted total, so there is no model score.</p>;
  return (
    <div className="rounded-lg border border-card-border bg-white/5 px-3 py-2 text-xs">
      <div className="flex justify-between gap-2">
        <span className="text-muted">Model score</span>
        <span className="font-mono font-semibold">{model.awayTag} {model.awayScore} {model.homeTag} {model.homeScore}</span>
      </div>
      <div className="flex justify-between gap-2 mt-1">
        <span className="text-muted">Model total</span>
        <span className="font-mono">{model.total}</span>
      </div>
      <p className="text-[11px] text-muted mt-1">{model.baseball ? "Run score from the posted total. A moneyline is not a run line." : "Straight score from the posted number. Not a private model."}</p>
    </div>
  );
}

export function GameHead({
  away,
  home,
  posted,
  total,
  forecast,
  sport,
}: {
  away: string;
  home: string;
  posted: string;
  total: string | number;
  forecast: string | null;
  sport?: string;
}) {
  const model = readModel(away, home, posted, total, sport);
  const missing = !forecast;
  const totalText = total === "" || total == null ? "NL" : String(total);
  return (
    <header className="border-b px-0 py-3 text-sm" style={{ borderColor: "#2c2c28", color: "#f0eee6" }}>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="min-w-0 truncate text-base font-medium">{away} @ {home}</h1>
        <span className="shrink-0 font-mono">{posted || "NL"}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="font-mono">{model ? `${model.awayTag} ${model.awayScore}, ${model.homeTag} ${model.homeScore}` : "No model score"}</span>
        <span className="text-right font-mono" style={{ color: missing ? "#c45c4a" : "#f0eee6" }}>
          {missing ? `${totalText} weather not loaded` : `${totalText} ${forecast}`}
        </span>
      </div>
    </header>
  );
}

export function ModelStrip({ away, home, spread, total, sport }: { away: string; home: string; spread: string; total: string | number; sport?: string }) {
  const model = readModel(away, home, spread, total, sport);
  if (!model) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-card-border pt-3 text-center">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted">{model.baseball ? "Run line" : "Score"}</div>
        <div className="font-mono text-sm">{model.awayTag} {model.awayScore} {model.homeTag} {model.homeScore}</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted">Total</div>
        <div className="font-mono text-sm">{model.total}</div>
      </div>
    </div>
  );
}
