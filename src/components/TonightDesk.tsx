"use client";

const PLAYS = [
  {
    pick: "Jaylen Warren over 15.5 rush attempts",
    score: 62,
    why: "Rico Dowdle is out with a toe, so the backfield is Warren. He just had 176 yards from scrimmage. Cleveland allows 2.7 explosive runs a game, 27th. The flag is Mason Graham, who has been wrecking interiors. If Graham lives in the backfield, the attempts can still come and the yards will not.",
  },
  {
    pick: "Pat Freiermuth over 27.5 receiving yards",
    score: 58,
    why: "Cleveland left zone after Week 1 and is 8th in man rate, first in middle-of-field closed. That is Cover 1, with Cover 2 on third and long. A tight end against a linebacker is the fit, not an outside receiver against Denzel Ward. Freiermuth had 3 catches for 63 yards in the December 28, 2025 meeting. Darnell Washington splits the room, so this is not a smash.",
  },
  {
    pick: "Harold Fannin Jr. anytime touchdown",
    score: 60,
    why: "Fannin has two scores in the last two weeks and 126 yards on the year. Pittsburgh is the zone side, Cover 3, and Joey Porter Jr. is in Dallas. Ramsey is questionable with a broken wrist. The case against is Watson behind a line missing Elgton Jenkins and Teven Jenkins, with T.J. Watt on the edge. Only if the number is plus money.",
  },
  {
    pick: "Under 38.5",
    score: 55,
    why: "The total opened 40.5 and is 38.5. Both teams are bad on third down, Cleveland is snapping with Luke Wypler, and Pittsburgh is 29th in third-down conversion. The case against is real: Rodgers threw three touchdowns last week and Watson has four in two weeks. This is a lean, not a 70.",
  },
];

export function TonightDesk({ away, home }: { away: string; home: string }) {
  const hit = [away, home].map((t) => t.toUpperCase());
  if (!hit.includes("PIT") || !(hit.includes("CLE"))) return null;
  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm">Thursday desk, Steelers at Browns</h3>
      <p className="text-[11px] text-muted">Coverage, injuries, and the last meeting. Not a median. Myles Garrett is not on the Browns depth chart.</p>
      {PLAYS.map((p) => (
        <div key={p.pick} className="border-t border-card-border pt-2 text-sm">
          <div className="flex justify-between gap-2"><span className="font-semibold">{p.pick}</span><span className="font-mono">{p.score}</span></div>
          <p className="text-xs mt-1">{p.why}</p>
        </div>
      ))}
      <p className="text-xs text-muted">Pass: Washington over 25. The book is 16.5. He had 5 catches for 77 yards in two 2025 Cleveland games, and 2 for 15 in the December 28 game before the broken arm. Rodgers over 211.5 is a pass too. He had 168 in that same meeting, and Cleveland is in man.</p>
    </section>
  );
}
