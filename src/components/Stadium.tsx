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

export function Stadium({ venue, team, name, rec, plays }: { venue?: string; team: string; name: string; rec: number; plays: Play[] }) {
  const dots = plays.map((p, idx) => ({ ...p, n: idx + 1 })).filter((p) => p.x != null && p.loc);
  const logo = `https://a.espncdn.com/i/teamlogos/nfl/500/${(team || "pit").toLowerCase()}.png`;
  const club = NAME[team] || team || "TEAM";
  const left = 78;
  const width = 760;
  return (
    <div className="overflow-hidden rounded-lg border border-black bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={logo} alt={club} className="h-14 w-14 rounded-full bg-white object-contain p-1" />
        <div>
          <div className="text-xl font-extrabold leading-none text-[#ffb612]">{name || "Receiver"} receptions <span className="text-white">— 2026</span></div>
          <div className="mt-1 text-sm text-white/80">End-of-play locations for {dots.length} of {rec} catches · {venue || "site"}</div>
        </div>
      </div>
      <div className="h-1.5 bg-[#ffb612]" />
      <svg viewBox="0 0 940 280" className="w-full bg-[#1c7a32]">
        <rect x="28" y="18" width="50" height="214" fill="#111" stroke="#fff" strokeWidth="2" />
        <rect x="862" y="18" width="50" height="214" fill="#111" stroke="#fff" strokeWidth="2" />
        <text x="53" y="128" fill="#ffb612" fontSize="16" fontWeight="800" textAnchor="middle" letterSpacing="4" transform="rotate(-90 53 128)">{club}</text>
        <text x="887" y="128" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="2" transform="rotate(90 887 128)">OPPONENT</text>
        <rect x={left} y="18" width={width} height="214" fill="#1f8a3a" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 101 }, (_, i) => left + i * (width / 100)).map((x, i) => (
          <line key={i} x1={x} y1="18" x2={x} y2="232" stroke="#fff" strokeWidth={i % 5 === 0 ? 1.35 : 0.45} opacity={i % 5 === 0 ? 0.95 : 0.45} />
        ))}
        {Array.from({ length: 20 }, (_, i) => left + (i + 0.5) * (width / 20)).map((x) => (
          <g key={x}>
            <line x1={x - 5} y1="86" x2={x + 5} y2="86" stroke="#fff" strokeWidth="1.5" />
            <line x1={x - 5} y1="164" x2={x + 5} y2="164" stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={i} x={left + i * (width / 10)} y="262" fill="#fff" fontSize="14" fontWeight="700" textAnchor="middle">{i * 10}</text>
        ))}
        <g stroke="#f4d27a" strokeWidth="3.5" fill="none" strokeLinecap="square">
          <path d="M10 78 h16 M10 78 v-22 M10 78 v22" />
          <path d="M10 168 h16 M10 168 v-22 M10 168 v22" />
          <path d="M930 78 h-16 M930 78 v-22 M930 78 v22" />
          <path d="M930 168 h-16 M930 168 v-22 M930 168 v22" />
        </g>
        <circle cx="458" cy="125" r="36" fill="#111" opacity="0.28" />
        <image href={logo} x="430" y="97" width="56" height="56" />
        {dots.map((p, i) => {
          const lane = p.loc === "left" ? 62 : p.loc === "right" ? 188 : 125;
          const y = lane + ((i % 3) - 1) * 8;
          const x = left + (Number(p.x) / 100) * width;
          return (
            <g key={p.n}>
              <circle cx={x} cy={y} r="13" fill={COLORS[(p.n - 1) % COLORS.length]} stroke="#fff" strokeWidth="1.7" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{p.n}</text>
            </g>
          );
        })}
      </svg>
      <div className="bg-white text-[#1c1c1c]">
        {plays.map((p, i) => (
          <div key={i} className="flex gap-3 px-3 py-2.5" style={{ background: i % 2 ? "#f3f4f6" : "#fff" }}>
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
            <span className="text-sm">
              <span className="block font-semibold">Week {p.week} vs {p.def} — Q{p.qtr || "?"}, {p.time || ""} — {ORD[Number(p.down)] || "?"} & {p.togo || "?"} — {p.yards ?? "?"} yards — {p.from || "?"} to {p.to || "end spot not in the play text"}</span>
              <span className="block text-[#4b5563]">Likely coverage: {(p.coverage || "estimate unavailable").replace("estimate: ", "")} | Likely concept: {(p.concept || "estimate unavailable").replace("estimate: ", "")}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="px-3 py-2 text-[11px] text-white/60">Source: nflverse 2026 play-by-play. Logo and left end zone are {club}, the receiver's team. Coverage and concept are estimates.</p>
    </div>
  );
}
