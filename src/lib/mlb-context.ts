import type { Check, Ticket } from "./ticket";
import type { MlbLine } from "./mlb-odds";

const PARKS: { keys: string[]; hr: string; runs: string }[] = [
  { keys: ["Coors"], hr: "high", runs: "highest-scoring park" },
  { keys: ["Great American", "Cincinnati"], hr: "high", runs: "bandbox" },
  { keys: ["Yankee"], hr: "high", runs: "short RF porch" },
  { keys: ["Fenway"], hr: "split", runs: "wall changes extra-base mix" },
  { keys: ["Wrigley"], hr: "wind", runs: "wind decides the total" },
  { keys: ["Petco"], hr: "low", runs: "large park, dead air" },
  { keys: ["Oracle", "San Francisco"], hr: "low", runs: "marine layer" },
  { keys: ["T-Mobile", "Seattle"], hr: "low", runs: "big alleys" },
  { keys: ["LoanDepot", "Miami"], hr: "low", runs: "heavy air" },
  { keys: ["PNC"], hr: "low", runs: "large LF" },
];

export type WeatherSnap = { temp: number; wind: number; precip: number; note: string };

export async function getWeather(lat?: number, lon?: number): Promise<WeatherSnap | null> {
  if (lat == null || lon == null) return null;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,precipitation&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;
  const d = await res.json();
  const c = d.current || {};
  const temp = Math.round(c.temperature_2m);
  const wind = Math.round(c.wind_speed_10m);
  const precip = Number(c.precipitation || 0);
  let note = `${temp}F, wind ${wind} mph`;
  if (precip >= 0.1) note += `, rain ${precip} in`;
  if (wind >= 15) note += " — wind is live for totals/HR";
  if (precip >= 0.15) note += " — rain is live for totals";
  return { temp, wind, precip, note };
}

export async function getVenue(gamePk: number) {
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gamePk}&hydrate=venue`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return { name: "", lat: undefined as number | undefined, lon: undefined as number | undefined, indoor: false };
  const d = await res.json();
  const v = d.dates?.[0]?.games?.[0]?.venue || {};
  const loc = v.location?.defaultCoordinates || {};
  return {
    name: v.name || "",
    lat: loc.latitude as number | undefined,
    lon: loc.longitude as number | undefined,
    indoor: Boolean(v.roofType && String(v.roofType).toLowerCase().includes("dome") || v.fieldInfo?.turfType === ""),
  };
}

export async function getStaffEra(teamId: number) {
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=2026&sportIds=1`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) return null;
  const d = await res.json();
  const s = d.stats?.[0]?.splits?.[0]?.stat || {};
  return {
    era: parseFloat(s.era || "0") || null,
    whip: parseFloat(s.whip || "0") || null,
    k9: s.strikeoutsPer9Inn ? parseFloat(s.strikeoutsPer9Inn) : null,
  };
}

function parkFor(name: string) {
  const hit = PARKS.find((p) => p.keys.some((k) => name.includes(k)));
  return hit || { hr: "avg", runs: "neutral park until proven otherwise" };
}

export async function mlbTicket(opts: {
  gamePk: number;
  game: string;
  venueName?: string;
  lineupPosted: boolean;
  homeId: number;
  awayId: number;
  line?: MlbLine | null;
}): Promise<Ticket & { weather: WeatherSnap | null; park: { hr: string; runs: string }; venue: string }> {
  const venue = await getVenue(opts.gamePk);
  const name = venue.name || opts.venueName || "";
  const park = parkFor(name);
  const indoor = /dome|roof|Tropicana|Minute Maid|Chase Field|Rogers Centre|LoanDepot|Globe Life/i.test(name);
  const weather = indoor ? { temp: 72, wind: 0, precip: 0, note: "Indoor / roof — weather is not live" } : await getWeather(venue.lat, venue.lon);
  const [homeStaff, awayStaff] = await Promise.all([getStaffEra(opts.homeId), getStaffEra(opts.awayId)]);
  const weatherFlag = Boolean(weather && !indoor && (weather.wind >= 15 || weather.precip >= 0.15));
  const checks: Check[] = [
    { id: "lineup", label: "Lineup / role", ok: opts.lineupPosted, detail: opts.lineupPosted ? "card posted" : "card not posted — batter and SB props are prior only" },
    { id: "line", label: "Number", ok: opts.line ? true : null, detail: opts.line ? `${opts.line.spread} · O/U ${opts.line.total} · ML ${opts.line.mlAway}/${opts.line.mlHome}` : "shop the number before you send it" },
    { id: "script", label: "Script", ok: true, detail: `park ${park.runs}` },
    { id: "sample", label: "Sample vs tonight", ok: true, detail: "L5 and BvP are on the lab; season rate is the prior" },
    { id: "weather", label: "Park / weather", ok: weatherFlag ? false : true, detail: weather?.note || "weather not loaded" },
    { id: "staff", label: "Staff behind the starter", ok: true, detail: `home staff ERA ${homeStaff?.era ?? "n/a"}, away staff ERA ${awayStaff?.era ?? "n/a"}` },
    { id: "abs", label: "ABS zone", ok: true, detail: "2026 challenge system. Zone is player-height based. Called K/BB props can flip on a challenge." },
    { id: "against", label: "Case against written", ok: true, detail: "required on every card" },
  ];
  return {
    sport: "MLB",
    game: opts.game,
    checks,
    script: `${park.runs}. ${weather?.note || "no weather"}.`,
    market: opts.line ? `posted ${opts.line.spread} / ${opts.line.total}` : "no posted line on this card",
    notes: [
      "ABS: two challenges per team. Do not treat 2025 called-strike rates as gospel.",
      indoor ? "Roof/dome — do not fade a total on wind." : "Outdoor — re-check wind at first pitch.",
    ],
    weather,
    park,
    venue: name,
  };
}
