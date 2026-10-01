type Spot = { loc: string; length: string; n: number };

const COLORS: Record<string, string> = {
  PIT: "#ffb612", CLE: "#ff3c00", BAL: "#241773", CIN: "#fb4f14", BUF: "#00338d", MIA: "#008e97",
  NE: "#002244", NYJ: "#125740", HOU: "#03202f", IND: "#002c5f", JAX: "#006778", TEN: "#0c2340",
  DEN: "#fb4f14", KC: "#e31837", LV: "#a5acaf", LAC: "#0080c6", DAL: "#041e42", NYG: "#0b2265",
  PHI: "#004c54", WAS: "#5a1414", CHI: "#0b162a", DET: "#0076b6", GB: "#203731", MIN: "#4f2683",
  ATL: "#a71930", CAR: "#0085ca", NO: "#d3bc8d", TB: "#d50a0a", ARI: "#97233f", LA: "#003594",
  SF: "#aa0000", SEA: "#002244",
};

export function Stadium({ venue, home, away, name, spots }: { venue?: string; home: string; away: string; name: string; spots: Spot[] }) {
  const lines = [10, 20, 30, 40, 50, 40, 30, 20, 10];
  const drawn = spots.filter((s) => s.loc && s.length);
  return (
    <div>
      <div className="text-xs text-muted mb-1">{venue || "Stadium"} · sky view · {name || "pick a receiver"}</div>
      <svg viewBox="0 0 160 108" className="w-full rounded-lg border border-card-border">
        <rect width="160" height="108" fill="#1b1c1f" />
        <rect x="8" y="8" width="144" height="92" rx="8" fill="#2a2c31" />
        <rect x="18" y="16" width="124" height="76" fill="#1f6b3a" />
        <rect x="18" y="16" width="14" height="76" fill={COLORS[away] || "#333"} />
        <rect x="128" y="16" width="14" height="76" fill={COLORS[home] || "#333"} />
        <text x="25" y="56" fontSize="4" fill="#fff" textAnchor="middle" transform="rotate(-90 25 56)">{away}</text>
        <text x="135" y="56" fontSize="4" fill="#fff" textAnchor="middle" transform="rotate(90 135 56)">{home}</text>
        {lines.map((n, i) => {
          const x = 32 + i * 10.6;
          return (
            <g key={n + "-" + i}>
              <line x1={x} y1="16" x2={x} y2="92" stroke="#f4f1ea" strokeWidth="0.35" />
              <text x={x + 1.2} y="24" fontSize="2.4" fill="#f4f1ea">{n}</text>
              <text x={x + 1.2} y="88" fontSize="2.4" fill="#f4f1ea">{n}</text>
            </g>
          );
        })}
        <line x1="32" y1="46" x2="128" y2="46" stroke="#f4f1ea" strokeWidth="0.25" />
        <line x1="32" y1="62" x2="128" y2="62" stroke="#f4f1ea" strokeWidth="0.25" />
        {[[18, 16], [142, 16], [18, 92], [142, 92]].map(([x, y], i) => (
          <rect key={i} x={x - 1.1} y={y - 1.1} width="2.2" height="2.2" fill="#ff8a00" />
        ))}
        <path d="M18 40 v-6 h-3 M18 68 v6 h-3 M142 40 v-6 h3 M142 68 v6 h3" fill="none" stroke="#f4d27a" strokeWidth="0.7" />
        <text x="80" y="12" fontSize="3.2" fill="#d7d2c8" textAnchor="middle">{(venue || "venue TBD").slice(0, 34)}</text>
        {drawn.map((s, i) => {
          const x = s.loc === "left" ? 52 : s.loc === "right" ? 108 : 80;
          const y = s.length === "deep" ? 34 : 70;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={2.2 + Math.min(3.5, s.n / 2)} fill="#e2b657" fillOpacity="0.92" />
              <text x={x} y={y + 1} textAnchor="middle" fontSize="2.4" fill="#111">{s.n}</text>
            </g>
          );
        })}
      </svg>
      <p className="text-[11px] text-muted mt-1">Pylons mark the corners. Numbers are the yard lines. Dots stay on the located lane only.</p>
    </div>
  );
}
