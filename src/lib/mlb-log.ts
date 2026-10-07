export type MlbSplit = {
  date?: string;
  gameType?: string;
  opponent?: { name?: string; abbreviation?: string };
  stat?: Record<string, number | string | undefined>;
};

export function personLogUrls(id: number, group: "hitting" | "pitching", season = 2026) {
  const base = `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=${group}&season=${season}`;
  return [base, `${base}&gameType=P`];
}

export function teamLogUrls(teamId: number, season = 2026) {
  const base = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=gameLog&group=hitting&season=${season}&sportId=1`;
  return [base, `${base}&gameType=P`];
}

export function readSplits(data: { stats?: { splits?: MlbSplit[] }[] } | null | undefined): MlbSplit[] {
  return data?.stats?.[0]?.splits || [];
}

export function mergeLogs(batches: MlbSplit[][]): MlbSplit[] {
  const seen = new Set<string>();
  const rows: MlbSplit[] = [];
  for (const batch of batches) {
    for (const row of batch) {
      if (row.gameType === "S" || row.gameType === "A") continue;
      const key = `${row.date || ""}|${row.gameType || ""}|${row.opponent?.abbreviation || row.opponent?.name || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return rows;
}
