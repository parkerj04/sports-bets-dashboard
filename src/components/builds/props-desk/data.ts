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
  { name: "Nick Muse", pos: "TE", espnId: "4249624", targets: 0, rec: 0, yards: 0, color: "#64748b" },
];

/** nflverse 2026 weeks 1–3. Active wide receivers and tight ends, including zeros. */
export const SAINTS_TARGETS: Mate[] = [
  { name: "Chris Olave", pos: "WR", espnId: "4361370", targets: 36, rec: 27, yards: 375, color: "#5b8cff" },
  { name: "Devaughn Vele", pos: "WR", espnId: "4569559", targets: 22, rec: 15, yards: 172, color: "#3dcca0" },
  { name: "Juwan Johnson", pos: "TE", espnId: "3929645", targets: 19, rec: 15, yards: 173, color: "#e6b450" },
  { name: "Noah Fant", pos: "TE", espnId: "4036131", targets: 12, rec: 8, yards: 66, color: "#f472b6" },
  { name: "Bryce Lance", pos: "WR", espnId: "4879276", targets: 8, rec: 4, yards: 50, color: "#22d3ee" },
  { name: "Oscar Delp", pos: "TE", espnId: "4702559", targets: 1, rec: 1, yards: 8, color: "#a78bfa" },
  { name: "Kevin Austin Jr.", pos: "WR", espnId: "4372758", targets: 1, rec: 1, yards: 7, color: "#c3e86a" },
  { name: "Treyton Welch", pos: "TE", espnId: "4430684", targets: 0, rec: 0, yards: 0, color: "#94a3b8" },
  { name: "Barion Brown", pos: "WR", espnId: "4698597", targets: 0, rec: 0, yards: 0, color: "#64748b" },
  { name: "Jalen Moreno-Cropper", pos: "WR", espnId: "4426990", targets: 0, rec: 0, yards: 0, color: "#78716c" },
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
  {
    slug: "juwan-johnson-rec-yds",
    player: "Juwan Johnson",
    espnId: "3929645",
    pos: "TE",
    team: "NO",
    market: "Receiving yards",
    line: 54.5,
    lineNote: "Research line on the middle of three games. Not a book price.",
    games: [54, 66, 53],
    chart: [
      { date: "Sep 13", abbr: "DET", value: 54 },
      { date: "Sep 20", abbr: "BAL", value: 66 },
      { date: "Sep 27", abbr: "LV", value: 53 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "15 catches on 19 targets, 173 yards. 57.7 yards per game.",
      "Every game is between 53 and 66. Week 3 was 8 catches on 8 targets for 53.",
      "Week 2 was 4 catches on 4 targets for 66.",
    ],
    bulletsAgainst: [
      "Only the 66 clears 54.5. The other two are 54 and 53. Median is 54.",
      "Falcons have allowed 52 yards per game to tight ends, 18th of 32. Not a soft spot.",
      "Three games. A line a few yards either way flips the count.",
    ],
    call: "No clear edge",
    callWhy: "The floor is real. The line sits on the median, so one yard is the whole over.",
  },
  {
    slug: "devaughn-vele-rec-yds",
    player: "Devaughn Vele",
    espnId: "4569559",
    pos: "WR",
    team: "NO",
    market: "Receiving yards",
    line: 64.5,
    lineNote: "Research line on the middle of three games. Not a book price.",
    games: [69, 64, 39],
    chart: [
      { date: "Sep 13", abbr: "DET", value: 69 },
      { date: "Sep 20", abbr: "BAL", value: 64 },
      { date: "Sep 27", abbr: "LV", value: 39 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "22 targets, 15 catches, 172 yards. Second on the Saints in targets.",
      "Week 1 was 7 catches on 9 targets for 69. Week 2 was 5 on 7 for 64.",
      "Falcons have allowed 201.3 receiving yards per game to wide receivers, 29th of 32.",
    ],
    bulletsAgainst: [
      "Only the 69 clears 64.5. Week 2 was 64, under. Week 3 was 39 on 6 targets.",
      "The log is falling: 69, then 64, then 39.",
      "Three games. The defense split is the whole team, not Vele.",
    ],
    call: "Shape leans under",
    callWhy: "The last game is the miss, and the line is the middle of a falling log.",
  },
  {
    slug: "noah-fant-rec-yds",
    player: "Noah Fant",
    espnId: "4036131",
    pos: "TE",
    team: "NO",
    market: "Receiving yards",
    line: 32.5,
    lineNote: "Research line just under the middle game. Not a book price.",
    games: [33, 0, 33],
    chart: [
      { date: "Sep 13", abbr: "DET", value: 33 },
      { date: "Sep 20", abbr: "BAL", value: 0 },
      { date: "Sep 27", abbr: "LV", value: 33 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "Two of three games were 33 yards. Week 1 was 4 catches on 8 targets. Week 3 was 4 on 4.",
      "12 targets and 8 catches on the season, 66 yards.",
    ],
    bulletsAgainst: [
      "Week 2 was a real zero: 0 targets. Average is 22, under 32.5.",
      "Juwan Johnson has 19 targets to Fant’s 12. This is the second tight end.",
      "Falcons tight-end yards allowed rank 18th. Not soft.",
    ],
    call: "No clear edge",
    callWhy: "Two 33s clear. The zero pulls the average under the line.",
  },
  {
    slug: "jahan-dotson-rec-yds",
    player: "Jahan Dotson",
    espnId: "4361409",
    pos: "WR",
    team: "ATL",
    market: "Receiving yards",
    line: 11.5,
    lineNote: "Research line on the middle of three games. Not a book price.",
    games: [19, 11, 11],
    chart: [
      { date: "Sep 13", abbr: "PIT", value: 19 },
      { date: "Sep 20", abbr: "CAR", value: 11 },
      { date: "Sep 24", abbr: "GB", value: 11 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "10 targets, second among Falcons wide receivers. Week 1 was 19 yards on 1 catch.",
      "He has a target in every game: 3, then 4, then 3.",
    ],
    bulletsAgainst: [
      "4 catches on 10 targets. The last two games were 11 and 11, both under 11.5.",
      "Saints have allowed 110 receiving yards per game to wide receivers, 6th fewest of 32.",
      "41 yards in three games. This is not a featured role.",
    ],
    call: "Shape leans under",
    callWhy: "Two of three games sit on 11. The defense he faces is tough on receivers.",
  },
  {
    slug: "austin-hooper-rec-yds",
    player: "Austin Hooper",
    espnId: "3043275",
    pos: "TE",
    team: "ATL",
    market: "Receiving yards",
    line: 15.5,
    lineNote: "Halfway between the two logged games. Not a book price.",
    games: [20, 11],
    chart: [
      { date: "Sep 20", abbr: "CAR", value: 20 },
      { date: "Sep 24", abbr: "GB", value: 11 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "4 catches on 6 targets, 31 yards. Same target count as Pitts, more yards.",
      "Week 2 was 2 catches on 4 targets for 20.",
      "Saints have allowed 83.3 yards per game to tight ends, 30th of 32.",
    ],
    bulletsAgainst: [
      "No Week 1 row. That is a missing game, not a zero.",
      "Week 3 was 2 catches on 2 targets for 11, under 15.5.",
      "Two games. Pitts is still on the field.",
    ],
    call: "Pass — missing games",
    callWhy: "One game over, one under, and Week 1 is not on the log.",
  },
  {
    slug: "bryce-lance-rec-yds",
    player: "Bryce Lance",
    espnId: "4879276",
    pos: "WR",
    team: "NO",
    market: "Receiving yards",
    line: 8.5,
    lineNote: "Research line on the middle game. Not a book price.",
    games: [42, 8, 0],
    chart: [
      { date: "Sep 13", abbr: "DET", value: 42 },
      { date: "Sep 20", abbr: "BAL", value: 8 },
      { date: "Sep 27", abbr: "LV", value: 0 },
      { date: "Oct 5", abbr: "ATL" },
    ],
    bulletsFor: [
      "Week 1 was 3 catches on 4 targets for 42.",
      "8 targets and 4 catches on the season, 50 yards.",
    ],
    bulletsAgainst: [
      "Week 2 was 1 catch for 8. Week 3 was 0 catches on 3 targets.",
      "Only the 42 clears 8.5. Median is 8.",
      "The 42 is the whole season. Two of three games do not clear a single catch.",
    ],
    call: "Shape leans under",
    callWhy: "One Detroit game is the log. The last two games are 8 and 0.",
  },
  {
    slug: "olamide-zaccheaus-rec-yds",
    player: "Olamide Zaccheaus",
    espnId: "3917914",
    pos: "WR",
    team: "ATL",
    market: "Receiving yards",
    line: 5.5,
    lineNote: "Research line on the middle game. Not a book price.",
    games: [5, 3, 9],
    chart: [
      { date: "Sep 13", abbr: "PIT", value: 5 },
      { date: "Sep 20", abbr: "CAR", value: 3 },
      { date: "Sep 24", abbr: "GB", value: 9 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "4 catches on 6 targets. A catch in every game: 5, 3, then 9 yards.",
      "Week 3 was 2 catches on 2 targets for 9.",
    ],
    bulletsAgainst: [
      "Only the 9 clears 5.5. Season total is 17 yards.",
      "Targets are 1, 3, and 2. This is not a featured route.",
      "Saints wide-receiver yards allowed rank 6th fewest.",
    ],
    call: "No clear edge",
    callWhy: "The role is real and small. The line is five and a half yards.",
  },
  {
    slug: "zachariah-branch-rec-yds",
    player: "Zachariah Branch",
    espnId: "4870612",
    pos: "WR",
    team: "ATL",
    market: "Receiving yards",
    line: 7.5,
    lineNote: "Research line on the middle game. Not a book price.",
    games: [0, 14, 7],
    chart: [
      { date: "Sep 13", abbr: "PIT", value: 0 },
      { date: "Sep 20", abbr: "CAR", value: 14 },
      { date: "Sep 24", abbr: "GB", value: 7 },
      { date: "Oct 5", abbr: "NO" },
    ],
    bulletsFor: [
      "3 catches on 4 targets, 21 yards. Week 2 was 2 catches for 14.",
      "Week 1 was a real zero targets, not a missing row.",
    ],
    bulletsAgainst: [
      "Only the 14 clears 7.5. Week 3 was 1 catch for 7.",
      "4 targets in three games.",
      "Saints wide-receiver defense is 6th fewest yards allowed.",
    ],
    call: "Shape leans under",
    callWhy: "One 14-yard game. The other two are 0 and 7.",
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
