const BASE = "https://statsapi.mlb.com/api/v1";

export type ZoneCell = { zone: string; value: number };

export async function getZones(playerId: number, group: "pitching" | "hitting", season = 2026) {
  const url = `${BASE}/people/${playerId}/stats?stats=hotColdZones&group=${group}&season=${season}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { strikes: [] as ZoneCell[], raw: {} as Record<string, ZoneCell[]> };
  const data = await res.json();
  const splits = data.stats?.[0]?.splits || [];
  const raw: Record<string, ZoneCell[]> = {};
  for (const s of splits) {
    const name = s.stat?.name || "unknown";
    raw[name] = (s.stat?.zones || []).map((z: { zone: string; value: string }) => ({
      zone: z.zone,
      value: parseFloat(z.value || "0"),
    }));
  }
  return { strikes: raw.numberOfStrikes || [], raw };
}
