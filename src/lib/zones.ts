const BASE = "https://statsapi.mlb.com/api/v1";

export type ZoneCell = { zone: string; value: number };

export async function getZones(playerId: number, group: "pitching" | "hitting", season = 2026) {
  const url = `${BASE}/people/${playerId}/stats?stats=hotColdZones&group=${group}&season=${season}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return empty();
  const data = await res.json();
  const raw: Record<string, ZoneCell[]> = {};
  for (const s of data.stats?.[0]?.splits || []) {
    const name = s.stat?.name || "unknown";
    raw[name] = (s.stat?.zones || []).map((z: { zone: string; value: string }) => ({
      zone: String(z.zone).padStart(2, "0"),
      value: parseFloat(String(z.value || "0").replace(/^\./, "0.")),
    }));
  }
  return {
    strikes: raw.numberOfStrikes || [],
    pitches: raw.numberOfPitches || raw.numberOfStrikes || [],
    avg: raw.battingAverage || [],
    slg: raw.sluggingPercentage || [],
    ops: raw.onBasePlusSlugging || [],
    ev: raw.exitVelocity || [],
    raw,
  };
}

function empty() {
  return { strikes: [] as ZoneCell[], pitches: [] as ZoneCell[], avg: [] as ZoneCell[], slg: [] as ZoneCell[], ops: [] as ZoneCell[], ev: [] as ZoneCell[], raw: {} as Record<string, ZoneCell[]> };
}
