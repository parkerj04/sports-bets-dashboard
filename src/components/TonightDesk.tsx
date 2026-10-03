"use client";

const RESULTS = [
  "Final: Steelers 24, Browns 27. ESPN.",
  "Jaylen Warren over 15.5 rush attempts: win, 17 carries.",
  "Jaylen Warren over 67.5 rush yards: win, 93 yards.",
  "Pat Freiermuth over 27.5 receiving yards: loss, 17 yards.",
  "Harold Fannin Jr. anytime touchdown: win, 1 receiving TD.",
  "Under 38.5: loss, total 51.",
];

export function TonightDesk({ away, home }: { away: string; home: string }) {
  const hit = [away, home].map((t) => t.toUpperCase());
  if (!hit.includes("PIT") || !(hit.includes("CLE"))) return null;
  return (
    <section className="card p-4 space-y-2">
      <h3 className="font-semibold text-sm">Results, Steelers at Browns</h3>
      <p className="text-[11px] text-muted">Off the open slate. Scores and props from the ESPN final box, not a projection.</p>
      {RESULTS.map((line) => <p key={line} className="text-sm border-t border-card-border pt-2">{line}</p>)}
    </section>
  );
}
