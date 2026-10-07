import { mergeLogs, personLogUrls, readSplits } from "./mlb-log";

const BASE = "https://statsapi.mlb.com/api/v1";

export type StartLog = {
  date: string;
  opp: string;
  ip: string;
  k: number;
  er: number;
  h: number;
  bb: number;
};

export type HandSplit = { side: string; avg: string; so: number; era?: string };

export type BvP = {
  batter: string;
  batterId: number;
  ab: number;
  h: number;
  hr: number;
  so: number;
  avg: string;
  ops: string;
};

export type PitcherDeep = {
  last5: StartLog[];
  last5K: number;
  last5IP: number;
  projK: number;
  lsRating: number;
  splits: HandSplit[];
};

async function json(url: string) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  return res.json();
}

export async function getPitcherLogs(playerId: number, season = 2026): Promise<StartLog[]> {
  const payloads = await Promise.all(personLogUrls(playerId, "pitching", season).map((url) => json(url)));
  const rows: StartLog[] = [];
  for (const s of mergeLogs(payloads.map(readSplits))) {
    const st = s.stat || {};
    if (!(st.gamesStarted || st.inningsPitched)) continue;
    rows.push({
      date: s.date || "",
      opp: s.opponent?.abbreviation || s.opponent?.name || "",
      ip: String(st.inningsPitched || ""),
      k: Number(st.strikeOuts) || 0,
      er: Number(st.earnedRuns) || 0,
      h: Number(st.hits) || 0,
      bb: Number(st.baseOnBalls) || 0,
    });
  }
  return rows.slice(-5).reverse();
}

export async function getPitcherSplits(playerId: number, season = 2026): Promise<HandSplit[]> {
  const data = await json(
    `${BASE}/people/${playerId}/stats?stats=statSplits&group=pitching&season=${season}&sitCodes=vl,vr`
  );
  const out: HandSplit[] = [];
  for (const s of data?.stats?.[0]?.splits || []) {
    const st = s.stat || {};
    out.push({
      side: s.split?.description || s.split?.code || "",
      avg: st.avg || ".000",
      so: st.strikeOuts || 0,
      era: st.era,
    });
  }
  return out;
}

export async function getBvP(batterId: number, pitcherId: number, batterName: string): Promise<BvP | null> {
  const data = await json(
    `${BASE}/people/${batterId}/stats?stats=vsPlayer&group=hitting&opposingPlayerId=${pitcherId}`
  );
  const st = data?.stats?.[0]?.splits?.[0]?.stat;
  if (!st || !(st.atBats || st.plateAppearances)) return null;
  return {
    batter: batterName,
    batterId,
    ab: st.atBats || 0,
    h: st.hits || 0,
    hr: st.homeRuns || 0,
    so: st.strikeOuts || 0,
    avg: st.avg || ".000",
    ops: st.ops || ".000",
  };
}

export function projectKs(k9: number, oppKpct: number) {
  const expIp = 5.8;
  const base = (k9 / 9) * expIp;
  const adj = oppKpct > 0 ? oppKpct / 22 : 1;
  return Math.round(base * adj * 10) / 10;
}

export function lsPitcherRating(k9: number, oppKpct: number, era: number, last5K: number) {
  const kPart = Math.min(40, Math.max(0, (k9 - 6) * 6));
  const lineup = Math.min(25, Math.max(0, (oppKpct - 18) * 3));
  const eraPart = Math.min(20, Math.max(0, (4.4 - era) * 8));
  const form = Math.min(15, last5K * 0.6);
  return Math.round(Math.min(99, kPart + lineup + eraPart + form));
}
