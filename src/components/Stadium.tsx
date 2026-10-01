"use client";

import { useEffect, useState } from "react";

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

function Post({ edge, dir }: { edge: number; dir: -1 | 1 }) {
  const mid = 123;
  const stem = edge + dir * 16;
  return (
    <g stroke="#f4d27a" strokeWidth="4" fill="none" strokeLinecap="square">
      <line x1={edge} y1={mid} x2={stem} y2={mid} />
      <line x1={stem} y1={mid - 22} x2={stem} y2={mid + 22} />
      <line x1={stem} y1={mid - 22} x2={stem + dir * 14} y2={mid - 22} />
      <line x1={stem} y1={mid + 22} x2={stem + dir * 14} y2={mid + 22} />
    </g>
  );
}

export function Stadium({ venue, home, away, team, name, rec, plays }: { venue?: string; home: string; away: string; team?: string; name: string; rec: number; plays: Play[] }) {
  const [open, setOpen] = useState(0);
  useEffect(() => setOpen(0), [name, home, away]);
  const club = (team || away || "").toUpperCase();
  const play = plays[open];
  const playerLogo = `https://a.espncdn.com/i/teamlogos/nfl/500/${club.toLowerCase()}.png`;
  const homeLogo = `https://a.espncdn.com/i/teamlogos/nfl/500/${home.toLowerCase()}.png`;
  const awaySkin = SKIN[away] || { end: "#111", ink: "#ffb612" };
  const homeSkin = SKIN[home] || { end: "#111", ink: "#ff3c00" };
  const clubSkin = SKIN[club] || awaySkin;
  const fieldX = 110;
  const fieldW = 780;
  return (
    <div className="overflow-hidden rounded-lg border border-black bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <img src={playerLogo} alt={club} className="h-14 w-14 rounded-full bg-white object-contain p-1" />
        <div>
          <div className="text-xl font-extrabold leading-none" style={{ color: clubSkin.ink }}>{name || "Receiver"} · {NAME[club] || club} <span className="text-white">— 2026</span></div>
          <div className="mt-1 text-sm text-white/80">Tap a dot. {plays.length} of {rec} catches · {venue || `${NAME[home] || home} home field`}</div>
        </div>
      </div>
      <div className="h-1.5" style={{ background: homeSkin.ink }} />
      <svg viewBox="0 0 1040 280" className="w-full bg-[#1f7a34]">
        <rect x="40" y="18" width="70" height="210" fill={awaySkin.end} stroke="#fff" strokeWidth="2" />
        <rect x="890" y="18" width="70" height="210" fill={homeSkin.end} stroke="#fff" strokeWidth="2" />
        <text x="75" y="126" fill={awaySkin.ink} fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing="1.5" transform="rotate(-90 75 126)">{NAME[away] || away}</text>
        <text x="925" y="126" fill={homeSkin.ink} fontSize="12" fontWeight="800" textAnchor="middle" letterSpacing="1.5" transform="rotate(90 925 126)">{NAME[home] || home}</text>
        <rect x={fieldX} y="18" width={fieldW} height="210" fill="#21863c" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => fieldX + (i / 20) * fieldW).map((x, i) => (
          <line key={i} x1={x} y1="18" x2={x} y2="228" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.5 : 0.7} />
        ))}
        {Array.from({ length: 20 }, (_, i) => fieldX + ((i + 0.5) / 20) * fieldW).map((x) => (
          <g key={x}>
            <line x1={x - 6} y1="82" x2={x + 6} y2="82" stroke="#fff" strokeWidth="1.4" />
            <line x1={x - 6} y1="164" x2={x + 6} y2="164" stroke="#fff" strokeWidth="1.4" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => {
          const x = fieldX + (i / 10) * fieldW;
          const label = i <= 5 ? i * 10 : (10 - i) * 10;
          return (
            <g key={i}>
              <line x1={x} y1="228" x2={x} y2="238" stroke="#fff" strokeWidth="1.2" />
              <text x={x} y="256" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">{label}</text>
            </g>
          );
        })}
        <Post edge={40} dir={-1} />
        <Post edge={960} dir={1} />
        <circle cx={fieldX + fieldW / 2} cy="123" r="32" fill="#111" opacity="0.28" />
        <image href={homeLogo} x={fieldX + fieldW / 2 - 24} y="99" width="48" height="48" />
        {plays.map((p, i) => {
          if (p.x == null || !p.loc) return null;
          const lane = p.loc === "left" ? 58 : p.loc === "right" ? 188 : 123;
          const y = lane + ((i % 3) - 1) * 8;
          const x = fieldX + (Number(p.x) / 100) * fieldW;
          const on = open === i;
          return (
            <g key={i} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={on ? 15 : 11} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={on ? 3 : 1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      {play && (
        <div className="m-3 rounded-lg bg-white p-3 text-[#1c1c1c]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: COLORS[open % COLORS.length] }}>{open + 1}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen((n) => Math.max(0, n - 1))} className="rounded border px-2 py-1 text-xs">Prev</button>
              <button type="button" onClick={() => setOpen((n) => Math.min(plays.length - 1, n + 1))} className="rounded border px-2 py-1 text-xs">Next</button>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold">Week {play.week} vs {play.def} — Q{play.qtr || "?"}, {play.time || ""} — {ORD[Number(play.down)] || "?"} & {play.togo || "?"} — {play.yards ?? "?"} yards</p>
          <p className="text-sm">{play.from || "?"} to {play.to || "end spot not in the play text"}</p>
          <p className="mt-1 text-sm text-[#4b5563]">Likely coverage: {(play.coverage || "estimate unavailable").replace("estimate: ", "")}</p>
          <p className="text-sm text-[#4b5563]">Likely concept: {(play.concept || "estimate unavailable").replace("estimate: ", "")}</p>
        </div>
      )}
    </div>
  );
}
