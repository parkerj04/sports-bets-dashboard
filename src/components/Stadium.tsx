type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

const COLORS = ["#e23b3b", "#2f6fed", "#f08a24", "#7a4de0", "#1f9d57", "#1aa7c7", "#d4b24a", "#d4537e"];
const ORD = ["", "1st", "2nd", "3rd", "4th"];
const SKIN: Record<string, { end: string; mark: string; trim: string }> = {
  CLE: { end: "#311d00", mark: "#ff3c00", trim: "#ff3c00" },
  PIT: { end: "#101010", mark: "#ffb612", trim: "#ffb612" },
  BAL: { end: "#241773", mark: "#9e7c0c", trim: "#9e7c0c" },
  CIN: { end: "#101010", mark: "#fb4f14", trim: "#fb4f14" },
  DAL: { end: "#041e42", mark: "#869397", trim: "#b0b7bc" },
  PHI: { end: "#004c54", mark: "#a5acaf", trim: "#a5acaf" },
  NYG: { end: "#0b2265", mark: "#a71930", trim: "#a71930" },
  WAS: { end: "#5a1414", mark: "#ffb612", trim: "#ffb612" },
};

export function Stadium({ venue, home, away, name, rec, plays }: { venue?: string; home: string; away: string; name: string; rec: number; plays: Play[] }) {
  const skin = SKIN[home] || { end: "#111", mark: "#f4f1ea", trim: "#ffb612" };
  const dots = plays.map((p, idx) => ({ ...p, n: idx + 1 })).filter((p) => p.x != null && p.loc);
  const logo = `https://a.espncdn.com/i/teamlogos/nfl/500/${home.toLowerCase()}.png`;
  return (
    <div className="space-y-2">
      <div className="border-b-4 pb-2" style={{ borderColor: skin.trim }}>
        <div className="text-lg font-bold">{name || "Receiver"} receptions <span className="text-muted font-semibold">2026</span></div>
        <p className="text-xs text-muted">End-of-play locations for {dots.length} of {rec} catches · {venue || `${home} stadium`}</p>
      </div>
      <svg viewBox="0 0 640 260" className="w-full rounded-md bg-[#1e7a3a]">
        <rect width="640" height="250" fill="#121316" />
        <rect x="8" y="8" width="624" height="4" fill={skin.trim} />
        <rect x="18" y="22" width="46" height="196" fill={skin.end} stroke="#fff" strokeWidth="2" />
        <rect x="576" y="22" width="46" height="196" fill={skin.end} stroke="#fff" strokeWidth="2" />
        <text x="41" y="126" fill={skin.mark} fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(-90 41 126)">{away}</text>
        <text x="599" y="126" fill={skin.mark} fontSize="12" fontWeight="700" textAnchor="middle" transform="rotate(90 599 126)">{home}</text>
        <rect x="64" y="22" width="512" height="196" fill="#1e7a3a" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => 64 + i * 25.6).map((x, i) => (
          <line key={i} x1={x} y1="22" x2={x} y2="218" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.4 : 0.6} opacity={i % 2 === 0 ? 0.95 : 0.55} />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={i} x={64 + i * 51.2} y="242" fill="#f4f1ea" fontSize="11" textAnchor="middle">{i * 10}</text>
        ))}
        <line x1="64" y1="82" x2="576" y2="82" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        <line x1="64" y1="158" x2="576" y2="158" stroke="#fff" strokeWidth="0.7" opacity="0.7" />
        {Array.from({ length: 20 }, (_, i) => 76 + i * 25.6).map((x) => (
          <g key={x}>
            <line x1={x} y1="74" x2={x} y2="90" stroke="#fff" strokeWidth="0.8" />
            <line x1={x} y1="150" x2={x} y2="166" stroke="#fff" strokeWidth="0.8" />
          </g>
        ))}
        <path d="M18 82 v-16 h-8 M18 158 v16 h-8 M622 82 v-16 h8 M622 158 v16 h8" fill="none" stroke="#f4d27a" strokeWidth="3" />
        <circle cx="320" cy="120" r="28" fill="#0e0e0c" opacity="0.35" />
        <image href={logo} x="296" y="96" width="48" height="48" />
        <text x="320" y="16" fill="#f4f1ea" fontSize="10" textAnchor="middle">{(venue || `${home} home field`).slice(0, 42)}</text>
        {dots.map((p, i) => {
          const lane = p.loc === "left" ? 62 : p.loc === "right" ? 178 : 120;
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
