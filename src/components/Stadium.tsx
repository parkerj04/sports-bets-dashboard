"use client";

import { useEffect, useState } from "react";

type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

const COLORS = ["#e23b3b", "#2f6fed", "#f08a24", "#7a4de0", "#1f9d57", "#1aa7c7", "#d4b24a", "#d4537e"];
const ORD = ["", "1st", "2nd", "3rd", "4th"];
const NAME: Record<string, string> = {
  PIT: "STEELERS", CLE: "BROWNS", BAL: "RAVENS", CIN: "BENGALS", BUF: "BILLS", MIA: "DOLPHINS",
  NE: "PATRIOTS", NYJ: "JETS", HOU: "TEXANS", IND: "COLTS", JAX: "JAGUARS", TEN: "TITANS",
  DEN: "BRONCOS", KC: "CHIEFS", LV: "RAIDERS", LAC: "CHARGERS", DAL: "COWBOYS", NYG: "GIANTS",
  PHI: "EAGLES", WAS: "COMMANDERS", WSH: "COMMANDERS", CHI: "BEARS", DET: "LIONS", GB: "PACKERS", MIN: "VIKINGS",
  ATL: "FALCONS", CAR: "PANTHERS", NO: "SAINTS", TB: "BUCS", ARI: "CARDINALS", LAR: "RAMS", LA: "RAMS",
  SF: "49ERS", SEA: "SEAHAWKS",
};
const SKIN: Record<string, { end: string; ink: string }> = {
  PIT: { end: "#101010", ink: "#ffb612" }, CLE: { end: "#311d00", ink: "#ff3c00" },
  BAL: { end: "#241773", ink: "#9e7c0c" }, CIN: { end: "#111111", ink: "#fb4f14" },
  BUF: { end: "#00338d", ink: "#c60c30" }, MIA: { end: "#008e97", ink: "#fc4c02" },
  NE: { end: "#002244", ink: "#c60c30" }, NYJ: { end: "#125740", ink: "#ffffff" },
  HOU: { end: "#03202f", ink: "#a71930" }, IND: { end: "#002c5f", ink: "#ffffff" },
  JAX: { end: "#006778", ink: "#d7a22a" }, TEN: { end: "#0c2340", ink: "#4b92db" },
  DEN: { end: "#002244", ink: "#fb4f14" }, KC: { end: "#e31837", ink: "#ffb81c" },
  LV: { end: "#000000", ink: "#a5acaf" }, LAC: { end: "#002a5e", ink: "#ffc20e" },
  DAL: { end: "#041e42", ink: "#869397" }, NYG: { end: "#0b2265", ink: "#a71930" },
  PHI: { end: "#004c54", ink: "#a5acaf" }, WAS: { end: "#5a1414", ink: "#ffb612" }, WSH: { end: "#5a1414", ink: "#ffb612" },
  CHI: { end: "#0b162a", ink: "#c83803" }, DET: { end: "#0076b6", ink: "#b0b7bc" },
  GB: { end: "#203731", ink: "#ffb612" }, MIN: { end: "#4f2683", ink: "#ffc62f" },
  ATL: { end: "#a71930", ink: "#ffffff" }, CAR: { end: "#0085ca", ink: "#101820" },
  NO: { end: "#101820", ink: "#d3bc8d" }, TB: { end: "#d50a0a", ink: "#ffffff" },
  ARI: { end: "#97233f", ink: "#ffb612" }, LA: { end: "#003594", ink: "#ffd100" }, LAR: { end: "#003594", ink: "#ffd100" },
  SF: { end: "#aa0000", ink: "#ffffff" }, SEA: { end: "#002244", ink: "#69be28" },
};

function Post({ edge, dir }: { edge: number; dir: -1 | 1 }) {
  const mid = 123;
  const upright = edge + dir * 10;
  return (
    <g stroke="#f4d27a" strokeWidth="3" fill="none">
      <line x1={edge} y1={mid} x2={upright} y2={mid} />
      <line x1={upright} y1={mid - 28} x2={upright} y2={mid + 28} />
      <path d={`M ${upright} ${mid - 28} q ${dir * 16} 0 ${dir * 16} 8`} />
      <path d={`M ${upright} ${mid + 28} q ${dir * 16} 0 ${dir * 16} -8`} />
    </g>
  );
}

export function Stadium({ venue, home, away, team, name, rec, plays }: { venue?: string; home: string; away: string; team?: string; name: string; rec: number; plays: Play[] }) {
  const [open, setOpen] = useState(0);
  useEffect(() => setOpen(0), [name, home, away]);
  const club = (team || away || "").toUpperCase();
  const homeKey = home.toUpperCase();
  const awayKey = away.toUpperCase();
  const playerLogo = `https://a.espncdn.com/i/teamlogos/nfl/500/${club.toLowerCase()}.png`;
  const awaySkin = SKIN[awayKey] || { end: "#111", ink: "#ffffff" };
  const homeSkin = SKIN[homeKey] || { end: "#111", ink: "#ffffff" };
  const clubSkin = SKIN[club] || awaySkin;
  const play = plays[open];
  const fieldX = 130;
  const fieldW = 740;
  return (
    <div className="overflow-hidden rounded-lg border border-black bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={playerLogo} alt={club} className="h-14 w-14 rounded-full bg-white object-contain p-1" />
        <div>
          <div className="text-xl font-extrabold leading-tight"><span style={{ color: clubSkin.ink }}>{name || "Player"}</span> <span className="text-white">— 2026</span></div>
          <div className="mt-1 text-sm text-white/80">{plays.length || rec} charted plays. {NAME[awayKey] || away} at {NAME[homeKey] || home}{venue ? ` · ${venue}` : ""}.</div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: homeSkin.ink }} />
      <svg viewBox="0 0 1040 280" className="w-full bg-[#1f7a34]">
        <rect x="36" y="18" width="94" height="210" fill={awaySkin.end} stroke="#fff" strokeWidth="2" />
        <rect x="870" y="18" width="94" height="210" fill={homeSkin.end} stroke="#fff" strokeWidth="2" />
        <text x="83" y="126" fill={awaySkin.ink} fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing="1" transform="rotate(-90 83 126)">{NAME[awayKey] || awayKey}</text>
        <text x="917" y="126" fill={homeSkin.ink} fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing="1" transform="rotate(90 917 126)">{NAME[homeKey] || homeKey}</text>
        <rect x={fieldX} y="18" width={fieldW} height="210" fill="#21863c" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => fieldX + (i / 20) * fieldW).map((x, i) => (
          <line key={i} x1={x} y1="18" x2={x} y2="228" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.6 : 0.6} />
        ))}
        {Array.from({ length: 20 }, (_, i) => fieldX + ((i + 0.5) / 20) * fieldW).map((x) => (
          <g key={x}>
            <line x1={x - 7} y1="78" x2={x + 7} y2="78" stroke="#fff" strokeWidth="1.4" />
            <line x1={x - 7} y1="168" x2={x + 7} y2="168" stroke="#fff" strokeWidth="1.4" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => {
          const x = fieldX + (i / 10) * fieldW;
          const label = i <= 5 ? i * 10 : (10 - i) * 10;
          return <text key={i} x={x} y="256" fill="#fff" fontSize="14" fontWeight="700" textAnchor="middle">{label}</text>;
        })}
        <Post edge={36} dir={-1} />
        <Post edge={964} dir={1} />
        <circle cx={fieldX + fieldW / 2} cy="123" r="28" fill="#111" opacity="0.28" />
        <image href={`https://a.espncdn.com/i/teamlogos/nfl/500/${homeKey.toLowerCase()}.png`} x={fieldX + fieldW / 2 - 18} y="105" width="36" height="36" />
        {plays.map((p, i) => {
          const lane = p.loc === "left" ? 58 : p.loc === "right" ? 188 : 123;
          const y = lane + ((i % 5) - 2) * 8;
          const spot = p.x == null ? 8 + ((i * 17) % 84) : Number(p.x);
          const x = fieldX + (spot / 100) * fieldW;
          const on = open === i;
          return (
            <g key={i} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="18" fill="transparent" />
              <circle cx={x} cy={y} r={on ? 14 : 10} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={on ? 3 : 1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <div className="m-3 rounded-lg bg-white p-3 text-[#1c1c1c]">
        {play ? (
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: COLORS[open % COLORS.length] }}>{open + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">vs {play.def} — Q{play.qtr || "?"}, {play.time || "—"} — {ORD[Number(play.down)] || "?"} & {play.togo || "?"} — {play.yards ?? "?"} yards — {play.from || "?"} to {play.to || "?"}</span>
              <span className="mt-0.5 block text-xs text-[#4b5563]">Likely coverage: {(play.coverage || "estimate unavailable").replace("estimate: ", "")} | Likely concept: {(play.concept || "estimate unavailable").replace("estimate: ", "")}</span>
            </span>
          </div>
        ) : (
          <p className="text-sm text-[#4b5563]">Tap a dot.</p>
        )}
      </div>
      <p className="px-3 pb-3 text-[11px] text-white/50">Dots are catch spots from the 2026 play file. Coverage lines are estimates, not charted film.</p>
    </div>
  );
}
