type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

const COLORS = ["#e23b3b", "#2f6fed", "#f08a24", "#7a4de0", "#1f9d57", "#1aa7c7", "#d4b24a", "#d4537e"];
const ORD = ["", "1st", "2nd", "3rd", "4th"];

export function Stadium({ venue, home, away, name, rec, plays }: { venue?: string; home: string; away: string; name: string; rec: number; plays: Play[] }) {
  const dots = plays.map((p, idx) => ({ ...p, n: idx + 1 })).filter((p) => p.x != null && p.loc);
  return (
    <div className="space-y-2">
      <div className="border-b-4 border-[#ffb612] pb-2">
        <div className="text-lg font-bold">{name || "Receiver"} receptions <span className="text-muted font-semibold">2026</span></div>
        <p className="text-xs text-muted">End-of-play locations for {dots.length} of {rec} catches · {venue || "this venue"}</p>
      </div>
      <svg viewBox="0 0 640 250" className="w-full rounded-md bg-[#1e7a3a]">
        <rect x="18" y="18" width="46" height="196" fill="#111" stroke="#fff" strokeWidth="2" />
        <rect x="576" y="18" width="46" height="196" fill="#111" stroke="#fff" strokeWidth="2" />
        <text x="41" y="122" fill="#ffb612" fontSize="13" fontWeight="700" textAnchor="middle" transform="rotate(-90 41 122)">{away}</text>
        <text x="599" y="122" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle" transform="rotate(90 599 122)">{home}</text>
        <rect x="64" y="18" width="512" height="196" fill="none" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => 64 + i * 25.6).map((x, i) => (
          <line key={i} x1={x} y1="18" x2={x} y2="214" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.4 : 0.6} opacity={i % 2 === 0 ? 0.95 : 0.55} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={i} x={64 + i * 51.2} y="236" fill="#f4f1ea" fontSize="11" textAnchor="middle">{i * 10}</text>
        ))}
        <line x1="64" y1="78" x2="576" y2="78" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        <line x1="64" y1="154" x2="576" y2="154" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        {Array.from({ length: 20 }, (_, i) => 76 + i * 25.6).map((x) => (
          <g key={x}>
            <line x1={x} y1="70" x2={x} y2="86" stroke="#fff" strokeWidth="0.8" />
            <line x1={x} y1="146" x2={x} y2="162" stroke="#fff" strokeWidth="0.8" />
          </g>
        ))}
        <path d="M18 78 v-16 h-8 M18 154 v16 h-8 M622 78 v-16 h8 M622 154 v16 h8" fill="none" stroke="#f4d27a" strokeWidth="3" />
        <text x="320" y="122" fill="#fff" fontSize="18" opacity="0.18" textAnchor="middle">{away}</text>
        {dots.map((p, i) => {
          const lane = p.loc === "left" ? 58 : p.loc === "right" ? 174 : 116;
          const y = lane + ((i % 3) - 1) * 8;
          const x = 64 + (Number(p.x) / 100) * 512;
          return (
            <g key={p.n}>
              <circle cx={x} cy={y} r="11" fill={COLORS[(p.n - 1) % COLORS.length]} stroke="#fff" strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{p.n}</text>
            </g>
          );
        })}
      </svg>
      <div className="rounded-lg overflow-hidden border border-card-border bg-white/5">
        {plays.map((p, i) => (
          <div key={i} className="flex gap-3 text-xs px-3 py-2 border-t border-card-border first:border-t-0">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
            <span>
              <span className="block font-medium">Week {p.week} {p.def} — Q{p.qtr || "?"}, {p.time || ""} — {ORD[Number(p.down)] || "?"} & {p.togo || "?"} — {p.yards ?? "?"} yards — {p.from || "?"} to {p.to || "not in the play"}</span>
              <span className="block text-muted">Likely coverage: {p.coverage || "estimate unavailable"} | Likely concept: {p.concept || "estimate unavailable"}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
