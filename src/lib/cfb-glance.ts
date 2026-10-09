export type CfbSide = {
  ppg: number;
  ppgRank: number;
  papg: number;
  papgRank: number;
  margin: number;
  marginRank: number;
};

export type CfbBook = {
  season: number;
  pool: number;
  teams: Map<string, CfbSide>;
};

export type CfbSheetRow = {
  label: string;
  away: string;
  home: string;
  awayRank?: string;
  homeRank?: string;
  better?: "away" | "home";
};

export type CfbSheet = {
  away: string;
  home: string;
  rows: CfbSheetRow[];
  note: string;
};

const EMPTY: CfbBook = { season: 2026, pool: 0, teams: new Map() };

type Cat = {
  name?: string;
  names?: string[];
  values?: unknown[];
  ranks?: unknown[];
  splitId?: string | number;
};

function num(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function loadCfbGlance(): Promise<CfbBook> {
  try {
    const res = await fetch(
      "https://site.web.api.espn.com/apis/common/v3/sports/football/college-football/statistics/byteam?region=us&lang=en&contentorigin=espn&limit=300&season=2026&seasontype=2",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return EMPTY;
    const data = await res.json();
    const passing = (data.categories || []).find((c: Cat) => c.name === "passing");
    const names: string[] = passing?.names || [];
    const pi = names.indexOf("totalPointsPerGame");
    if (pi < 0) return EMPTY;
    const draft: { abbr: string; ppg: number; ppgRank: number; papg: number; papgRank: number; margin: number }[] = [];
    for (const t of data.teams || []) {
      const abbr = String(t.team?.abbreviation || "");
      if (!abbr) continue;
      const cats: Cat[] = t.categories || [];
      const own = cats.find((c) => c.name === "passing" && String(c.splitId) === "0");
      const opp = cats.find((c) => c.name === "passing" && String(c.splitId) === "900");
      const ppg = num(own?.values?.[pi]);
      const ppgRank = num(own?.ranks?.[pi]);
      const papg = num(opp?.values?.[pi]);
      const papgRank = num(opp?.ranks?.[pi]);
      if (ppg == null || papg == null || ppgRank == null || papgRank == null) continue;
      draft.push({
        abbr,
        ppg,
        ppgRank,
        papg,
        papgRank,
        margin: Math.round((ppg - papg) * 10) / 10,
      });
    }
    const ranked = [...draft].sort((a, b) => b.margin - a.margin || a.abbr.localeCompare(b.abbr));
    const marginRank = new Map<string, number>();
    for (let i = 0; i < ranked.length; ) {
      let j = i + 1;
      while (j < ranked.length && ranked[j].margin === ranked[i].margin) j += 1;
      for (let k = i; k < j; k += 1) marginRank.set(ranked[k].abbr, i + 1);
      i = j;
    }
    const teams = new Map<string, CfbSide>();
    for (const row of draft) {
      teams.set(row.abbr, {
        ppg: row.ppg,
        ppgRank: row.ppgRank,
        papg: row.papg,
        papgRank: row.papgRank,
        margin: row.margin,
        marginRank: marginRank.get(row.abbr) || draft.length,
      });
    }
    return { season: Number(data.requestedSeason?.year) || 2026, pool: draft.length, teams };
  } catch {
    return EMPTY;
  }
}

function ord(n: number) {
  const v = Math.abs(n) % 100;
  const d = n % 10;
  if (v >= 11 && v <= 13) return `${n}th`;
  if (d === 1) return `${n}st`;
  if (d === 2) return `${n}nd`;
  if (d === 3) return `${n}rd`;
  return `${n}th`;
}

function signed(n: number) {
  const v = n.toFixed(1);
  return n > 0 ? `+${v}` : v;
}

function winPct(rec: string) {
  const m = String(rec || "").match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const w = Number(m[1]);
  const l = Number(m[2]);
  return w + l === 0 ? null : w / (w + l);
}

function betterNum(away: number, home: number, higher: boolean): "away" | "home" | undefined {
  if (away === home) return undefined;
  return (higher ? away > home : away < home) ? "away" : "home";
}

export function toSheet(g: {
  awayAbbr: string;
  homeAbbr: string;
  awayRecord: string;
  homeRecord: string;
  glance: { season: number; pool: number; away: CfbSide; home: CfbSide } | null;
}): CfbSheet | null {
  const gl = g.glance;
  if (!gl?.away || !gl?.home || !gl.pool) return null;
  const a = gl.away;
  const h = gl.home;
  const aw = winPct(g.awayRecord);
  const hm = winPct(g.homeRecord);
  const recBetter = aw == null || hm == null || aw === hm ? undefined : aw > hm ? "away" : "home";
  return {
    away: g.awayAbbr,
    home: g.homeAbbr,
    rows: [
      { label: "Record", away: g.awayRecord || "-", home: g.homeRecord || "-", better: recBetter },
      { label: "Points / game", away: a.ppg.toFixed(1), home: h.ppg.toFixed(1), awayRank: ord(a.ppgRank), homeRank: ord(h.ppgRank), better: betterNum(a.ppg, h.ppg, true) },
      { label: "Allowed / game", away: a.papg.toFixed(1), home: h.papg.toFixed(1), awayRank: ord(a.papgRank), homeRank: ord(h.papgRank), better: betterNum(a.papg, h.papg, false) },
      { label: "Margin", away: signed(a.margin), home: signed(h.margin), awayRank: ord(a.marginRank), homeRank: ord(h.marginRank), better: betterNum(a.margin, h.margin, true) },
    ],
    note: `Green is the better number. Ranks are 1st-best among ${gl.pool} teams in the ${gl.season} ESPN feed. Margin is points per game minus points allowed, ranked from those rates. No Elo. No model percent.`,
  };
}
