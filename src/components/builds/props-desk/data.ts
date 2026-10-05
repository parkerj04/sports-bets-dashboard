export type Pos = "WR" | "RB" | "TE" | "QB";

export type ChartBar = { date: string; abbr: string; value?: number };

export type PropCard = {
  slug: string;
  player: string;
  espnId: string;
  pos: Pos;
  team: "ATL" | "NO";
  market: string;
  line: number;
  lineNote: string;
  games: number[];
  chart: ChartBar[];
  bulletsFor: string[];
  bulletsAgainst: string[];
  call: string;
  callWhy: string;
};

export type Mate = {
  name: string;
  pos: Pos;
  espnId: string;
  targets: number;
  rec: number;
  yards: number;
  color: string;
};

export const FALCONS_TARGETS: Mate[] = [
  { name: "Drake London", pos: "WR", espnId: "4426502", targets: 20, rec: 15, yards: 274, color: "#5b8cff" },
  { name: "Bijan Robinson", pos: "RB", espnId: "4430807", targets: 17, rec: 13, yards: 118, color: "#ff6b6b" },
  { name: "Jahan Dotson", pos: "WR", espnId: "4361409", targets: 11, rec: 4, yards: 41, color: "#3dcca0" },
  { name: "Austin Hooper", pos: "TE", espnId: "3043275", targets: 6, rec: 4, yards: 31, color: "#e6b450" },
  { name: "Olamide Zaccheaus", pos: "WR", espnId: "3917914", targets: 6, rec: 4, yards: 17, color: "#a78bfa" },
  { name: "Kyle Pitts Sr.", pos: "TE", espnId: "4360248", targets: 6, rec: 2, yards: 20, color: "#f472b6" },
  { name: "Zachariah Branch", pos: "WR", espnId: "4870612", targets: 4, rec: 3, yards: 21, color: "#22d3ee" },
  { name: "Chris Blair", pos: "WR", espnId: "4369886", targets: 3, rec: 1, yards: 6, color: "#c3e86a" },
  { name: "Brian Robinson Jr.", pos: "RB", espnId: "4241474", targets: 2, rec: 2, yards: 16, color: "#e879f9" },
  { name: "Charlie Woerner", pos: "TE", espnId: "4035020", targets: 1, rec: 0, yards: 0, color: "#94a3b8" },
];

export const FALCONS_RUSH = [
  { name: "Bijan Robinson", yards: 349, carries: 66, color: "#ff6b6b" },
  { name: "Brian Robinson Jr.", yards: 132, carries: 30, color: "#e879f9" },
];

export type DvpCell = { per: number; rank: number };

/** ESPN box scores, completed 2026 games. Per game. Rank 1 = fewest allowed of 32. */
export const DVP: Record<"ATL" | "NO", Record<Pos, Record<string, DvpCell>>> = {
  NO: {
    QB: { car: { per: 3, rank: 10 }, ryds: { per: 13, rank: 11 } },
    RB: {
      rec: { per: 4.7, rank: 19 },
      tgt: { per: 4.7, rank: 8 },
      yds: { per: 36.3, rank: 21 },
      car: { per: 24.3, rank: 25 },
      ryds: { per: 115.7, rank: 31 },
    },
    WR: { rec: { per: 10, rank: 11 }, tgt: { per: 17, rank: 10 }, yds: { per: 110, rank: 6 } },
    TE: { rec: { per: 8.3, rank: 31 }, tgt: { per: 11.3, rank: 30 }, yds: { per: 83.3, rank: 30 } },
  },
  ATL: {
    QB: { car: { per: 2, rank: 2 }, ryds: { per: -0.3, rank: 1 } },
    RB: {
      rec: { per: 4.7, rank: 18 },
      tgt: { per: 7, rank: 26 },
      yds: { per: 20, rank: 6 },
      car: { per: 15.3, rank: 1 },
      ryds: { per: 48, rank: 2 },
    },
    WR: { rec: { per: 14.3, rank: 28 }, tgt: { per: 25, rank: 32 }, yds: { per: 201.3, rank: 29 } },
    TE: { rec: { per: 6, rank: 23 }, tgt: { per: 8, rank: 22 }, yds: { per: 52, rank: 18 } },
  },
};

export const PROPS: PropCard[] = [
  {
    slug: "michael-penix-pass-yds",
    player: "Michael Penix Jr.",
    espnId: "4360423",
    pos: "QB",
    team: "ATL",
    market: "Passing yards",
    line: 230.5,
    lineNote: "Research line next to the middle of the last 10 logged games, 221 and 241. Not a book price.",
    games: [256],
    chart: [
      { date: "Sep 7", abbr: "TB", value: 298 },
      { date: "Sep 14", abbr: "MIN", value: 135 },
      { date: "Sep 21", abbr: "CAR", value: 172 },
      { date: "Sep 28", abbr: "WSH", value: 313 },
      { date: "Oct 13", abbr: "BUF", value: 250 },
      { date: "Oct 19", abbr: "SF", value: 241 },
      { date: "Nov 2", abbr: "NE", value: 221 },
      { date: "Nov 9", abbr: "IND", value: 177 },
      { date: "Nov 16", abbr: "CAR", value: 175 },
      { date: "Sep 24", abbr: "GB", value: 256 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "Only 2026 start: Sep 24 at Green Bay, 18 of 25, 256 yards, 1 touchdown, 1 interception. ESPN.",
      "Last 10 logged games average 223.8. Five of those 10 cleared 230.5.",
    ],
    bulletsAgainst: [
      "One 2026 game. Cooper Rush started Weeks 1 and 2 (229 yards, 4 interceptions). Jack Strand threw 59 yards and an interception in Week 2.",
      "2025 was 166 of 276 for 1,982 yards, 9 touchdowns, 3 interceptions in 9 games.",
      "No Saints game in this log. The defense panel's quarterback row is rushing allowed, not passing yards.",
    ],
    call: "No clear edge",
    callWhy: "The only 2026 start clears 230.5. The last 10 are a coin flip, and he has not played New Orleans in this log.",
  },
  {
    slug: "tyler-shough-pass-yds",
    player: "Tyler Shough",
    espnId: "4360689",
    pos: "QB",
    team: "NO",
    market: "Passing yards",
    line: 257.5,
    lineNote: "Research line between the two middle games of the last 10, 255 and 259. Not a book price.",
    games: [410, 252, 255],
    chart: [
      { date: "Sep 21", abbr: "SEA", value: 0 },
      { date: "Oct 26", abbr: "TB", value: 128 },
      { date: "Nov 2", abbr: "LAR", value: 176 },
      { date: "Nov 9", abbr: "CAR", value: 282 },
      { date: "Nov 23", abbr: "ATL", value: 243 },
      { date: "Nov 30", abbr: "MIA", value: 239 },
      { date: "Dec 7", abbr: "TB", value: 144 },
      { date: "Dec 14", abbr: "CAR", value: 272 },
      { date: "Dec 21", abbr: "NYJ", value: 308 },
      { date: "Dec 28", abbr: "TEN", value: 333 },
      { date: "Jan 4", abbr: "ATL", value: 259 },
      { date: "Sep 13", abbr: "DET", value: 410 },
      { date: "Sep 20", abbr: "BAL", value: 252 },
      { date: "Sep 27", abbr: "LV", value: 255 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "2026: 91 of 132, 917 yards, 8 touchdowns, 3 interceptions. Games: 410, 252, 255. ESPN.",
      "Two 2025 games against Atlanta: 243 and 259.",
    ],
    bulletsAgainst: [
      "Sep 21, 2025 vs Seattle is in the log: 0 yards on 2 attempts. Leaving it out would fake the longer windows.",
      "2026 is three games. 252 and 255 are both under 257.5. The 410 at Detroit is the outlier.",
      "10 sacks already in 2026. Passing yards allowed by Atlanta are not ranked on the defense panel.",
    ],
    call: "No clear edge",
    callWhy: "The season average is carried by 410 yards. Two of the three 2026 games sit just under 257.5.",
  },
  {
    slug: "drake-london-rec-yds",
    player: "Drake London",
    espnId: "4426502",
    pos: "WR",
    team: "ATL",
    market: "Receiving yards",
    line: 79.5,
    lineNote: "Research line. Not a live book price.",
    games: [29, 51, 194],
    chart: [
      { date: "Oct 20", abbr: "SF", value: 42 },
      { date: "Nov 2", abbr: "NE", value: 118 },
      { date: "Nov 9", abbr: "IND", value: 104 },
      { date: "Nov 16", abbr: "CAR", value: 119 },
      { date: "Dec 21", abbr: "ARI", value: 27 },
      { date: "Dec 30", abbr: "LAR", value: 4 },
      { date: "Jan 4", abbr: "NO", value: 78 },
      { date: "Sep 13", abbr: "PIT", value: 29 },
      { date: "Sep 20", abbr: "CAR", value: 51 },
      { date: "Sep 24", abbr: "GB", value: 194 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "2026 log: 15 catches, 20 targets, 274 yards. 91.3 yards per game.",
      "20 of 76 tracked Falcons targets (26.3%).",
      "Week 3 at Green Bay: 9 catches, 10 targets, 194 yards.",
    ],
    bulletsAgainst: [
      "Only 1 of 3 games in 2026 cleared 79.5. The other two were 29 and 51. Median is 51.",
      "Strip out the 194 and the other two games average 40.",
      "Saints have allowed 110 receiving yards per game to wide receivers, 6th fewest of 32. Tight ends are the soft spot, not receivers.",
    ],
    call: "No clear edge",
    callWhy: "The average beats 79.5. The median does not. One Green Bay game is the whole over.",
  },
  {
    slug: "kyle-pitts-rec-yds",
    player: "Kyle Pitts Sr.",
    espnId: "4360248",
    pos: "TE",
    team: "ATL",
    market: "Receiving yards",
    line: 14.5,
    lineNote: "Research line. Not a live book price.",
    games: [0, 15, 5],
    chart: [
      { date: "Nov 23", abbr: "NO", value: 25 },
      { date: "Nov 30", abbr: "NYJ", value: 82 },
      { date: "Dec 7", abbr: "SEA", value: 90 },
      { date: "Dec 12", abbr: "TB", value: 166 },
      { date: "Dec 21", abbr: "ARI", value: 57 },
      { date: "Dec 30", abbr: "LAR", value: 16 },
      { date: "Jan 4", abbr: "NO", value: 58 },
      { date: "Sep 13", abbr: "PIT", value: 0 },
      { date: "Sep 20", abbr: "CAR", value: 15 },
      { date: "Sep 24", abbr: "GB", value: 5 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "Last 10 logged games: 8 of 10 cleared 14.5. Average 51.4. That sample is mostly 2025.",
      "Two games against New Orleans in that log: 25 and 58.",
      "Saints have allowed 8.3 receptions, 11.3 targets, and 83.3 yards per game to tight ends. Ranks 31st, 30th, and 30th of 32.",
    ],
    bulletsAgainst: [
      "2026 log is 0, 15, and 5. Only the 15 clears 14.5. Average 6.7.",
      "2 catches on 6 targets. Catch rate 33%. Hooper has the same 6 targets and more yards.",
      "A soft tight-end defense does not create targets. Pitts is 7.9% of tracked Falcons targets.",
    ],
    call: "No clear edge",
    callWhy: "The long log and the Saints tight-end split say over. The 2026 role says under.",
  },
  {
    slug: "bijan-robinson-rush-yds",
    player: "Bijan Robinson",
    espnId: "4430807",
    pos: "RB",
    team: "ATL",
    market: "Rushing yards",
    line: 89.5,
    lineNote: "Research line near his median. Not a book number.",
    games: [83, 72, 194],
    chart: [
      { date: "Nov 23", abbr: "NO", value: 70 },
      { date: "Nov 30", abbr: "NYJ", value: 142 },
      { date: "Dec 7", abbr: "SEA", value: 86 },
      { date: "Dec 12", abbr: "TB", value: 93 },
      { date: "Dec 21", abbr: "ARI", value: 76 },
      { date: "Dec 30", abbr: "LAR", value: 195 },
      { date: "Jan 4", abbr: "NO", value: 33 },
      { date: "Sep 13", abbr: "PIT", value: 83 },
      { date: "Sep 20", abbr: "CAR", value: 72 },
      { date: "Sep 24", abbr: "GB", value: 194 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "66 carries, 349 yards, 5.3 per carry. 116.3 yards per game.",
      "Saints have allowed 115.7 rush yards per game to running backs, 31st of 32.",
    ],
    bulletsAgainst: [
      "1 of 3 games in 2026 cleared 89.5. Median is 83. Same Green Bay spike as London.",
      "Brian Robinson Jr. has 30 carries and 132 yards. This is not a one-back backfield.",
    ],
    call: "No clear edge",
    callWhy: "Average 116, median 83. The over needs the Green Bay script.",
  },
  {
    slug: "chris-olave-rec-yds",
    player: "Chris Olave",
    espnId: "4361370",
    pos: "WR",
    team: "NO",
    market: "Receiving yards",
    line: 99.5,
    lineNote: "Research line. Not his posted price.",
    games: [182, 86, 107],
    chart: [
      { date: "Nov 9", abbr: "CAR", value: 104 },
      { date: "Nov 23", abbr: "ATL", value: 70 },
      { date: "Nov 30", abbr: "MIA", value: 47 },
      { date: "Dec 7", abbr: "TB", value: 30 },
      { date: "Dec 14", abbr: "CAR", value: 85 },
      { date: "Dec 21", abbr: "NYJ", value: 148 },
      { date: "Dec 28", abbr: "TEN", value: 119 },
      { date: "Sep 13", abbr: "DET", value: 182 },
      { date: "Sep 20", abbr: "BAL", value: 86 },
      { date: "Sep 27", abbr: "LV", value: 107 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "2026 log: 27 catches, 36 targets, 375 yards. Two of three cleared 99.5.",
      "Falcons have allowed 201.3 receiving yards per game to wide receivers, 29th of 32.",
    ],
    bulletsAgainst: [
      "Three games. Week 2 was 86, under 99.5.",
      "There is no book price on this desk. A higher line changes the read.",
    ],
    call: "Shape leans over",
    callWhy: "The cleanest over shape on the board, and it is still only three games with no price.",
  },
  {
    slug: "bijan-robinson-rec-yds",
    player: "Bijan Robinson",
    espnId: "4430807",
    pos: "RB",
    team: "ATL",
    market: "Receiving yards",
    line: 24.5,
    lineNote: "Research line under his average. Not a book number.",
    games: [90, 9, 19],
    chart: [
      { date: "Nov 23", abbr: "NO", value: 37 },
      { date: "Nov 30", abbr: "NYJ", value: 51 },
      { date: "Dec 7", abbr: "SEA", value: 8 },
      { date: "Dec 12", abbr: "TB", value: 82 },
      { date: "Dec 21", abbr: "ARI", value: 92 },
      { date: "Dec 30", abbr: "LAR", value: 34 },
      { date: "Jan 4", abbr: "NO", value: 10 },
      { date: "Sep 13", abbr: "PIT", value: 90 },
      { date: "Sep 20", abbr: "CAR", value: 9 },
      { date: "Sep 24", abbr: "GB", value: 19 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: ["13 catches on 17 targets, 118 yards. Week 1 was 8 catches for 90."],
    bulletsAgainst: ["After Week 1 the log is 9 and 19. Targets fell from 10 to 4 to 2."],
    call: "Shape leans under",
    callWhy: "Usage is trending the wrong way. Week 1 is doing the average.",
  },
  {
    slug: "alvin-kamara-rush-yds",
    player: "Alvin Kamara",
    espnId: "3054850",
    pos: "RB",
    team: "NO",
    market: "Rushing yards",
    line: 49.5,
    lineNote: "Research line. Log is two 2026 games.",
    games: [15, 36],
    chart: [
      { date: "Sep 28", abbr: "BUF", value: 70 },
      { date: "Oct 5", abbr: "NYG", value: 27 },
      { date: "Oct 12", abbr: "NE", value: 31 },
      { date: "Oct 19", abbr: "CHI", value: 28 },
      { date: "Oct 26", abbr: "TB", value: 21 },
      { date: "Nov 2", abbr: "LAR", value: 14 },
      { date: "Nov 9", abbr: "CAR", value: 83 },
      { date: "Nov 23", abbr: "ATL", value: 11 },
      { date: "Sep 20", abbr: "BAL", value: 15 },
      { date: "Sep 27", abbr: "LV", value: 36 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: ["Week 3 was 9 carries, 36 yards. Week 2 was 9 carries, 15."],
    bulletsAgainst: [
      "No Week 1 row on the ESPN log. Do not invent a zero.",
      "Falcons have allowed 48 rush yards per game to running backs, 2nd fewest of 32.",
      "Travis Etienne Jr. is on the roster. His carries are not on this card.",
    ],
    call: "Pass — missing games",
    callWhy: "Two quiet games and a teammate whose carries are not on this card.",
  },
];

export function teamLogo(abbr: string) {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}

export function headshot(id: string) {
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${id}.png`;
}

export function summarize(values: number[], line: number) {
  const n = values.length;
  const hits = values.filter((v) => v > line).length;
  const avg = n ? values.reduce((a, b) => a + b, 0) / n : 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = n ? sorted[Math.floor((n - 1) / 2)] : 0;
  return { n, hits, avg, mid, pct: n ? hits / n : 0 };
}

export function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}

export function one(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function ordinal(n: number) {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${suffix}`;
}
