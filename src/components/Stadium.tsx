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
const SKIN: Record<string, { end: string; ink: string }> = {
  PIT: { end: "#101010", ink: "#ffb612" }, CLE: { end: "#311d00", ink: "#ff3c00" },
  BAL: { end: "#241773", ink: "#c60c30" }, CIN: { end: "#111", ink: "#fb4f14" },
  DAL: { end: "#041e42", ink: "#b0b7bc" }, PHI: { end: "#004c54", ink: "#a5acaf" },
};

export function Stadium({ venue, home, away, name, rec, plays }: { venue?: string; home: string; away: string; name: string; rec: number; plays: Play[] }) {
  const dots = plays.map((p, idx) => ({ ...p, n: idx + 1 })).filter((p) => p.x != null && p.loc);
  const logo = `https://a.espncdn.com/i/teamlogos/nfl/500/${home.toLowerCase()}.png`;
  const awaySkin = SKIN[away] || { end: "#111", ink: "#ffb612" };
  const homeSkin = SKIN[home] || { end: "#111", ink: "#ff3c00" };
  const left = 86;
  const width = 700;
  return (
    <div className="overflow-hidden rounded-lg border border-black bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={logo} alt={home} className="h-14 w-14 rounded-full bg-white object-contain p-1" />
        <div>
          <div className="text-xl font-extrabold leading-none" style={{ color: homeSkin.ink }}>{name || "Receiver"} receptions <span className="text-white">— 2026</span></div>
          <div className="mt-1 text-sm text-white/80">End-of-play locations for {dots.length} of {rec} catches · {venue || `${NAME[home] || home} home field`}</div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: homeSkin.ink }} />
      <svg viewBox="0 0 900 270" className="w-full bg-[#1f7a34]">
        <rect x="24" y="18" width="62" height="210" fill={awaySkin.end} stroke="#fff" strokeWidth="2" />
        <rect x="786" y="18" width="62" height="210" fill={homeSkin.end} stroke="#fff" strokeWidth="2" />
        <text x="55" y="126" fill={awaySkin.ink} fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="2" transform="rotate(-90 55 126)">{NAME[away] || away}</text>
        <text x="817" y="126" fill={homeSkin.ink} fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="2" transform="rotate(90 817 126)">{NAME[home] || home}</text>
        <rect x={left} y="18" width={width} height="210" fill="#21863c" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => left + i * (width / 20)).map((x, i) => (
          <line key={i} x1={x} y1="18" x2={x} y2="228" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.5 : 0.7} opacity={i % 2 === 0 ? 1 : 0.65} />
        ))}
        {Array.from({ length: 20 }, (_, i) => left + (i + 0.5) * (width / 20)).map((x) => (
          <g key={x}>
            <line x1={x - 5} y1="84" x2={x + 5} y2="84" stroke="#fff" strokeWidth="1.4" />
            <line x1={x - 5} y1="162" x2={x + 5} y2="162" stroke="#fff" strokeWidth="1.4" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <text key={i} x={left + i * (width / 10)} y="256" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">{i * 10}</text>
        ))}
        <g stroke="#f4d27a" strokeWidth="3.5" fill="none">
          <path d="M8 123 h14 M8 104 v38" />
          <path d="M892 123 h-14 M892 104 v38" />
        </g>
        <circle cx="436" cy="123" r="34" fill="#111" opacity="0.28" />
        <image href={logo} x="410" y="97" width="52" height="52" />
        {dots.map((p, i) => {
          const lane = p.loc === "left" ? 60 : p.loc === "right" ? 186 : 123;
          const y = lane + ((i % 3) - 1) * 8;
          const x = left + (Number(p.x) / 100) * width;
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
              <span className="block font-semibold">Week {p.week} vs {p.def} — Q{p.qtr || "?"}, {p.time || ""} — {ORD[Number(p.down)] || "?"} & {p.togo || "?"} — {p.yards ?? "?"} yards — {p.from || "?"} to {p.to || "end spot not in the play text"}</span>
              <span className="block text-[#4b5563]">Likely coverage: {(p.coverage || "estimate unavailable").replace("estimate: ", "")} | Likely concept: {(p.concept || "estimate unavailable").replace("estimate: ", "")}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
