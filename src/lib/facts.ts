import { unstable_cache } from "next/cache";

export type ArmUse = { name: string; g: number; k9: number };
export type Crew = {
  umpire: { name: string; k9: number | null; k: number; ip: string; games: number } | null;
  pens: { team: string; arms: ArmUse[] }[];
};
export type DeskFacts = { open: string | null; situation: string | null; crew: Crew | null };

const BOARD: Record<string, string> = {
  nfl: "football/nfl",
  cfb: "football/college-football",
  mlb: "baseball/mlb",
};

type Ask = {
  sport: string;
  away: string;
  home: string;
  awayAbbr: string;
  homeAbbr: string;
  awayId: number;
  homeId: number;
  awayPitcherId: number;
  homePitcherId: number;
  awayPitcher: string;
  homePitcher: string;
};

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function innings(ip: string | number) {
  const [whole, frac] = String(ip || "0").split(".");
  const outs = frac === "1" ? 1 / 3 : frac === "2" ? 2 / 3 : 0;
  return (Number(whole) || 0) + outs;
}

function fmtIp(ip: number) {
  let whole = Math.floor(ip + 1e-8);
  let outs = Math.round((ip - whole) * 3);
  if (outs >= 3) {
    whole += 1;
    outs = 0;
  }
  return outs ? `${whole}.${outs}` : String(whole);
}

function et(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const grab = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return {
    weekday: grab("weekday"),
    hour: Number(grab("hour")),
    label: `${grab("weekday")} ${grab("month")} ${grab("day")}`,
    ymd: new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)),
  };
}

function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

function cleanTotal(line: string | undefined) {
  if (!line) return "";
  return String(line).replace(/^[ou]/i, "");
}

type Comp = { team?: { displayName?: string; abbreviation?: string }; homeAway?: string };
type Event = { date?: string; competitions?: { competitors?: Comp[]; status?: { type?: { name?: string } }; odds?: Record<string, unknown>[] }[] };

function comps(ev: Event) {
  return ev.competitions?.[0]?.competitors || [];
}

function matched(ev: Event, ask: Ask) {
  const rows = comps(ev);
  const abbrs = rows.map((c) => (c.team?.abbreviation || "").toUpperCase());
  if (ask.awayAbbr && ask.homeAbbr && abbrs.includes(ask.awayAbbr.toUpperCase()) && abbrs.includes(ask.homeAbbr.toUpperCase())) return true;
  const names = rows.map((c) => (c.team?.displayName || "").toLowerCase());
  const hit = (name: string) => names.some((n) => n === name.toLowerCase() || n.includes(name.toLowerCase()) || name.toLowerCase().includes(n));
  return hit(ask.away) && hit(ask.home);
}

function openLine(odds: Record<string, unknown> | undefined) {
  if (!odds) return null;
  const home = (odds.homeTeamOdds as { team?: { abbreviation?: string } } | undefined)?.team?.abbreviation || "";
  const spread = odds.pointSpread as { home?: { open?: { line?: string }; close?: { line?: string } } } | undefined;
  const total = odds.total as { over?: { open?: { line?: string }; close?: { line?: string } } } | undefined;
  const opened = spread?.home?.open?.line;
  const now = spread?.home?.close?.line;
  const totalOpen = cleanTotal(total?.over?.open?.line);
  const totalNow = cleanTotal(total?.over?.close?.line);
  const parts: string[] = [];
  if (opened && now && home) parts.push(`Spread opened ${home} ${opened}, now ${home} ${now}.`);
  if (totalOpen && totalNow) parts.push(`Total opened ${totalOpen}, now ${totalNow}.`);
  return parts.length ? `${parts.join(" ")} Source: ESPN.` : null;
}

const board = unstable_cache(async (sport: string) => {
  const path = BOARD[sport];
  if (!path) return [];
  const data = await getJson(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`);
  return (data?.events || []) as Event[];
}, ["desk-board"], { revalidate: 600 });

const schedule = unstable_cache(async (sport: string, abbr: string) => {
  const path = BOARD[sport];
  if (!path || !abbr) return [];
  const data = await getJson(`https://site.api.espn.com/apis/site/v2/sports/${path}/teams/${encodeURIComponent(abbr)}/schedule?season=2026`);
  return (data?.events || []) as Event[];
}, ["desk-schedule"], { revalidate: 21600 });

function finalBefore(events: Event[], when: string) {
  const cut = new Date(when).getTime();
  return events
    .filter((ev) => {
      const name = ev.competitions?.[0]?.status?.type?.name || "";
      return name.includes("FINAL") && ev.date && new Date(ev.date).getTime() < cut;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
}

async function situation(ask: Ask, game: Event | undefined) {
  if (!game?.date) return null;
  const bits: string[] = [];
  const cur = et(game.date);
  const sides = [
    { name: ask.away, abbr: ask.awayAbbr },
    { name: ask.home, abbr: ask.homeAbbr },
  ];
  for (const side of sides) {
    if (!side.abbr) continue;
    const prev = finalBefore(await schedule(ask.sport, side.abbr), game.date);
    if (!prev?.date) continue;
    const then = et(prev.date);
    const days = daysBetween(then.ymd, cur.ymd);
    if (ask.sport !== "mlb" && days > 0 && days <= 4) {
      bits.push(then.weekday === "Thu" && cur.weekday === "Mon"
        ? `${side.name} is on a Thursday-to-Monday turn.`
        : `${side.name} is on a short week, last played ${then.label}.`);
    }
    if (days === 1 && then.hour >= 18 && cur.hour < 17) bits.push(`${side.name} is in a day game after a night game.`);
  }
  if (ask.sport === "mlb") {
    const arms = [
      { id: ask.awayPitcherId, name: ask.awayPitcher },
      { id: ask.homePitcherId, name: ask.homePitcher },
    ];
    for (const arm of arms) {
      if (!arm.id || !arm.name) continue;
      const last = await lastStart(arm.id);
      if (!last) continue;
      const days = daysBetween(last, cur.ymd);
      if (days >= 1 && days <= 4) bits.push(`${arm.name} is on ${days} days' rest.`);
    }
  }
  return bits.length ? bits.join(" ") : null;
}

async function lastStart(id: number) {
  const data = await getJson(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=gameLog&group=pitching&season=2026`);
  let last = "";
  for (const row of data?.stats?.[0]?.splits || []) {
    if (!row?.stat?.gamesStarted || !row.date) continue;
    if (row.date > last) last = row.date;
  }
  return last;
}

const plateGames = unstable_cache(async () => {
  const data = await getJson("https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=2026-08-01&endDate=2026-10-06&hydrate=officials&gameTypes=R,F,D,L,W");
  const rows: { pk: number; date: string; hp: string; final: boolean }[] = [];
  for (const day of data?.dates || []) {
    for (const game of day.games || []) {
      const hp = (game.officials || []).find((o: { officialType?: string }) => o.officialType === "Home Plate");
      if (!hp?.official?.fullName) continue;
      rows.push({
        pk: game.gamePk,
        date: game.officialDate || String(game.gameDate || "").slice(0, 10),
        hp: hp.official.fullName,
        final: game.status?.abstractGameState === "Final",
      });
    }
  }
  return rows;
}, ["hp-games-2026"], { revalidate: 21600 });

const umpireRate = unstable_cache(async (name: string) => {
  const games = (await plateGames()).filter((g) => g.final && g.hp === name).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const boxes = await Promise.all(games.map(async (g) => {
    const data = await getJson(`https://statsapi.mlb.com/api/v1/game/${g.pk}/boxscore`);
    let k = 0;
    let ip = 0;
    for (const side of ["away", "home"]) {
      const pitching = data?.teams?.[side]?.teamStats?.pitching;
      if (!pitching) return null;
      k += pitching.strikeOuts || 0;
      ip += innings(pitching.inningsPitched);
    }
    return ip > 0 ? { k, ip } : null;
  }));
  const used = boxes.filter((b): b is { k: number; ip: number } => !!b);
  const k = used.reduce((s, b) => s + b.k, 0);
  const ip = used.reduce((s, b) => s + b.ip, 0);
  return { k, ip: fmtIp(ip), games: used.length, k9: used.length >= 3 && ip > 0 ? Math.round((k / ip) * 9 * 10) / 10 : null };
}, ["ump-k"], { revalidate: 21600 });

const penArms = unstable_cache(async (teamId: number, team: string, starterId: number) => {
  const data = await getJson(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=2026&sportIds=1&teamId=${teamId}&playerPool=ALL&limit=50`);
  const arms = (data?.stats?.[0]?.splits || [])
    .filter((s: { player?: { id?: number }; stat?: { gamesStarted?: number; gamesPlayed?: number } }) => (s.stat?.gamesStarted || 0) === 0 && (s.stat?.gamesPlayed || 0) > 0 && s.player?.id !== starterId)
    .sort((a: { stat?: { gamesPlayed?: number } }, b: { stat?: { gamesPlayed?: number } }) => (b.stat?.gamesPlayed || 0) - (a.stat?.gamesPlayed || 0))
    .slice(0, 2)
    .map((s: { player?: { fullName?: string }; stat?: { gamesPlayed?: number; strikeOuts?: number; inningsPitched?: string } }) => {
      const ip = innings(s.stat?.inningsPitched || 0);
      const k9 = ip > 0 ? Math.round((((s.stat?.strikeOuts || 0) / ip) * 9) * 10) / 10 : 0;
      return { name: s.player?.fullName || "Reliever", g: s.stat?.gamesPlayed || 0, k9 };
    });
  return { team, arms };
}, ["pen-arms"], { revalidate: 21600 });

async function crew(ask: Ask): Promise<Crew | null> {
  if (ask.sport !== "mlb" || !ask.awayId || !ask.homeId) return null;
  const data = await getJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${ask.homeId}&startDate=2026-10-01&endDate=2026-10-08&hydrate=officials,team`);
  let hp = "";
  for (const day of data?.dates || []) {
    for (const game of day.games || []) {
      const awayId = game.teams?.away?.team?.id;
      const homeId = game.teams?.home?.team?.id;
      if (awayId !== ask.awayId || homeId !== ask.homeId) continue;
      hp = (game.officials || []).find((o: { officialType?: string }) => o.officialType === "Home Plate")?.official?.fullName || "";
    }
  }
  const [rate, awayPen, homePen] = await Promise.all([
    hp ? umpireRate(hp) : Promise.resolve(null),
    penArms(ask.awayId, ask.away, ask.awayPitcherId),
    penArms(ask.homeId, ask.home, ask.homePitcherId),
  ]);
  return {
    umpire: hp ? { name: hp, k9: rate?.k9 ?? null, k: rate?.k || 0, ip: rate?.ip || "0", games: rate?.games || 0 } : null,
    pens: [awayPen, homePen],
  };
}

export async function deskFacts(ask: Ask): Promise<DeskFacts> {
  const events = await board(ask.sport);
  const game = events.find((ev) => matched(ev, ask));
  const filled = { ...ask };
  if (game && (!filled.awayAbbr || !filled.homeAbbr)) {
    for (const row of comps(game)) {
      const name = row.team?.displayName || "";
      const abbr = row.team?.abbreviation || "";
      const hit = (team: string) => name.toLowerCase() === team.toLowerCase() || name.toLowerCase().includes(team.toLowerCase());
      if (!filled.awayAbbr && hit(filled.away)) filled.awayAbbr = abbr;
      if (!filled.homeAbbr && hit(filled.home)) filled.homeAbbr = abbr;
    }
  }
  const odds = game?.competitions?.[0]?.odds?.[0] as Record<string, unknown> | undefined;
  const [note, staff] = await Promise.all([situation(filled, game), crew(filled)]);
  return { open: openLine(odds), situation: note, crew: staff };
}

export function askFrom(q: URLSearchParams): Ask {
  const num = (key: string) => Number(q.get(key) || 0);
  return {
    sport: (q.get("sport") || "").toLowerCase(),
    away: q.get("away") || "",
    home: q.get("home") || "",
    awayAbbr: q.get("awayAbbr") || "",
    homeAbbr: q.get("homeAbbr") || "",
    awayId: num("awayId"),
    homeId: num("homeId"),
    awayPitcherId: num("awayPitcherId"),
    homePitcherId: num("homePitcherId"),
    awayPitcher: q.get("awayPitcher") || "",
    homePitcher: q.get("homePitcher") || "",
  };
}
