type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

const COLORS = ["#e23b3b", "#2f6fed", "#f08a24", "#7a4de0", "#1f9d57", "#1aa7c7", "#d4b24a", "#d4537e"];
const ORD = ["", "1st", "2nd", "3rd", "4th"];
const NAME: Record<string, string> = {
  PIT: "STEELERS", CLE: "BROWNS", BAL: "RAVENS", CIN: "BENGALS", BUF: "BILLS", MIA: "DOLPHINS",
  NE: "PATRIOTS", NYJ: "JETS", HOU: "TEXANS", IND: "COLTS", JAX: "JAGUARS", TEN: "TITANS",
  DEN: "BRONCOS", KC: "CHIEFS", LV: "RAIDERS", LAC: "CHARGERS", DAL: "COWBOYS", NYG: "GIANTS",
  PHI: "EAGLES", WAS: "COMMANDERS", CHI: "BEARS", DET: "LIONS", GB: "PACKERS", MIN: "VIKINGS",
  ATL: "FALCONS", CAR: "PANTHERS", NO: "SAINTS", TB: "BUCS", ARI: "CARDINALS", LA: "RAMS",
  SF: "49ERS", SEA: "SEAHAWKS",
};
const SKIN: Record<string, { end: string; ink: string; trim: string }> = {
  CLE: { end: "#311d00", ink: "#ff3c00", trim: "#ff3c00" },
  PIT: { end: "#111", ink: "#ffb612", trim: "#ffb612" },
  BAL: { end: "#241773", ink: "#c60c30", trim: "#9e7c0c" },
  CIN: { end: "#111", ink: "#fb4f14", trim: "#fb4f14" },
  DAL: { end: "#041e42", ink: "#869397", trim: "#b0b7bc" },
};

export function Stadium({ venue, home, away, name, rec, plays }: { venue?: string; home: string; away: string; name: string; rec: number; plays: Play[] }) {
  const skin = SKIN[home] || { end: "#111", ink: "#ffb612", trim: "#ffb612" };
  const dots = plays.map((p, idx) => ({ ...p, n: idx + 1 })).filter((p) => p.x != null && p.loc);
  const logo = `https://a.espncdn.com/i/teamlogos/nfl/500/${home.toLowerCase()}.png`;
  const awayName = NAME[away] || away;
  const homeName = NAME[home] || home;
  return (
    <div className="overflow-hidden rounded-lg border border-black bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={logo} alt={home} className="h-12 w-12 rounded-full bg-white object-contain p-1" />
        <div>
          <div className="text-xl font-extrabold leading-none" style={{ color: skin.trim }}>{name || "Receiver"} receptions <span className="text-white">— 2026</span></div>
          <div className="mt-1 text-sm text-white/80">End-of-play locations for {dots.length} of {rec} catches · {venue || `${homeName} home field`}</div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: skin.trim }} />
      <svg viewBox="0 0 760 250" className="w-full bg-[#1f7a34]">
        <rect x="36" y="16" width="58" height="196" fill={skin.end} stroke="#fff" strokeWidth="2" />
        <rect x="666" y="16" width="58" height="196" fill={skin.end} stroke="#fff" strokeWidth="2" />
        <text x="65" y="118" fill={skin.ink} fontSize="15" fontWeight="800" textAnchor="middle" letterSpacing="3" transform="rotate(-90 65 118)">{awayName}</text>
        <text x="695" y="118" fill={skin.ink} fontSize="15" fontWeight="800" textAnchor="middle" letterSpacing="3" transform="rotate(90 695 118)">{homeName}</text>
        <rect x="94" y="16" width="572" height="196" fill="#1f7a34" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => 94 + i * 28.6).map((x, i) => (
          <line key={`y${i}`} x1={x} y1="16" x2={x} y2="212" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.6 : 0.7} opacity={i % 2 === 0 ? 1 : 0.7} />
        ))}
        {Array.from({ length: 20 }, (_, i) => 108 + i * 28.6).map((x) => (
          <g key={`h${x}`}>
            <line x1={x - 4} y1="78" x2={x + 4} y2="78" stroke="#fff" strokeWidth="1.4" />
            <line x1={x - 4} y1="150" x2={x + 4} y2="150" stroke="#fff" strokeWidth="1.4" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={`n${i}`} x={94 + i * 57.2} y="236" fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">{i * 10}</text>
        ))}
        <g stroke="#f4d27a" strokeWidth="3" fill="none">
          <path d="M18 78 h14 M18 62 v32" />
          <path d="M18 150 h14 M18 134 v32" />
          <path d="M742 78 h-14 M742 62 v32" />
          <path d="M742 150 h-14 M742 134 v32" />
        </g>
        <circle cx="380" cy="114" r="34" fill="#111" opacity="0.28" />
        <image href={logo} x="354" y="88" width="52" height="52" />
        {dots.map((p, i) => {
          const lane = p.loc === "left" ? 58 : p.loc === "right" ? 170 : 114;
          const y = lane + ((i % 3) - 1) * 7;
          const x = 94 + (Number(p.x) / 100) * 572;
          return (
            <g key={p.n}>
              <circle cx={x} cy={y} r="12" fill={COLORS[(p.n - 1) % COLORS.length]} stroke="#fff" strokeWidth="1.6" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{p.n}</text>
            </g>
          );
        })}
      </svg>
      <div className="bg-white text-[#1c1c1c]">
        {plays.map((p, i) => (
          <div key={i} className="flex gap-3 px-3 py-2.5" style={{ background: i % 2 ? "#f3f4f6" : "#fff" }}>
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
            <span className="text-sm">
              <span className="block font-semibold">Week {p.week} vs {p.def} — Q{p.qtr || "?"}, {p.time || ""} — {ORD[Number(p.down)] || "?"} & {p.togo || "?"} — {p.yards ?? "?"} yards — {p.from || "?"} to {p.to || "not in the play"}</span>
              <span className="block text-[#4b5563]">Likely coverage: {(p.coverage || "estimate unavailable").replace("estimate: ", "")} | Likely concept: {(p.concept || "estimate unavailable").replace("estimate: ", "")}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="px-3 py-2 text-[11px] text-white/60">Source: nflverse 2026 play-by-play. Coverage and concept lines are estimates from the play shape, not charted film. Field is {venue || "the home stadium"}.</p>
    </div>
  );
}
