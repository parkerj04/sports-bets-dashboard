type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

const COLORS = ["#e23b3b", "#2f6fed", "#f08a24", "#7a4de0", "#1f9d57", "#1aa7c7", "#d4b24a", "#d4537e"];
const LANE: Record<string, number> = { left: 22, middle: 40, right: 58 };
const ORD = ["", "1st", "2nd", "3rd", "4th"];

export function Stadium({ venue, home, away, name, rec, plays }: { venue?: string; home: string; away: string; name: string; rec: number; plays: Play[] }) {
  const dots = plays.map((p, i) => ({ ...p, n: i + 1 })).filter((p) => p.x != null && LANE[p.loc]);
  return (
    <div className="space-y-2">
      <div>
        <div className="font-semibold">{name || "Receiver"} receptions <span className="text-muted font-normal">2026</span></div>
        <p className="text-[11px] text-muted">End spot for {dots.length} of {rec} catches · {venue || "this venue"}. Coverage and concept are estimates.</p>
      </div>
      <svg viewBox="0 0 220 78" className="w-full rounded-lg border border-card-border bg-[#1f6b3a]">
        <rect x="8" y="8" width="18" height="54" fill="#111" />
        <rect x="194" y="8" width="18" height="54" fill="#111" />
        <text x="17" y="38" fontSize="3.2" fill="#fff" textAnchor="middle" transform="rotate(-90 17 38)">{away}</text>
        <text x="203" y="38" fontSize="3.2" fill="#fff" textAnchor="middle" transform="rotate(90 203 38)">{home}</text>
        {Array.from({ length: 11 }, (_, i) => 26 + i * 15.2).map((x, i) => (
          <g key={i}>
            <line x1={x} y1="8" x2={x} y2="62" stroke="#f4f1ea" strokeWidth="0.35" />
            <text x={x} y="70" fontSize="3" fill="#f4f1ea" textAnchor="middle">{i * 10}</text>
          </g>
        ))}
        <line x1="26" y1="28" x2="178" y2="28" stroke="#f4f1ea" strokeWidth="0.25" />
        <line x1="26" y1="48" x2="178" y2="48" stroke="#f4f1ea" strokeWidth="0.25" />
        {dots.map((p) => {
          const x = 26 + (Number(p.x) / 100) * 152;
          const y = LANE[p.loc];
          return (
            <g key={p.n}>
              <circle cx={x} cy={y} r="3.1" fill={COLORS[(p.n - 1) % COLORS.length]} stroke="#fff" strokeWidth="0.4" />
              <text x={x} y={y + 1} textAnchor="middle" fontSize="2.6" fill="#fff">{p.n}</text>
            </g>
          );
        })}
      </svg>
      <div className="rounded-lg overflow-hidden border border-card-border">
        {plays.map((p, i) => (
          <div key={i} className="flex gap-2 text-xs px-2 py-1.5 border-t border-card-border first:border-t-0">
            <span className="font-mono w-5" style={{ color: COLORS[i % COLORS.length] }}>{i + 1}</span>
            <span>
              <span className="block">Week {p.week} {p.def} · Q{p.qtr || "?"} {p.time || ""} · {ORD[Number(p.down)] || "?"} & {p.togo || "?"} · {p.yards ?? "?"} yards · {p.from || "?"} to {p.to || "not in the play"}</span>
              <span className="block text-muted">Likely coverage: {p.coverage || "estimate unavailable"} · Likely concept: {p.concept || "estimate unavailable"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
