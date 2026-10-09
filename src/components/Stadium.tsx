"use client";

import { useEffect, useState } from "react";

type Play = { week: string; def: string; loc: string; yards: number | null; qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string; x?: number | null; coverage?: string; concept?: string };

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
  BAL: { end: "#241773", ink: "#ffffff" }, CIN: { end: "#111111", ink: "#fb4f14" },
  BUF: { end: "#00338d", ink: "#ffffff" }, MIA: { end: "#008e97", ink: "#ffffff" },
  NE: { end: "#002244", ink: "#ffffff" }, NYJ: { end: "#125740", ink: "#ffffff" },
  HOU: { end: "#03202f", ink: "#ffffff" }, IND: { end: "#002c5f", ink: "#ffffff" },
  JAX: { end: "#006778", ink: "#ffffff" }, TEN: { end: "#0c2340", ink: "#ffffff" },
  DEN: { end: "#002244", ink: "#ffffff" }, KC: { end: "#e31837", ink: "#ffffff" },
  LV: { end: "#000000", ink: "#ffffff" }, LAC: { end: "#002a5e", ink: "#ffffff" },
  DAL: { end: "#041e42", ink: "#ffffff" }, NYG: { end: "#0b2265", ink: "#ffffff" },
  PHI: { end: "#004c54", ink: "#ffffff" }, WAS: { end: "#5a1414", ink: "#ffffff" }, WSH: { end: "#5a1414", ink: "#ffffff" },
  CHI: { end: "#0b162a", ink: "#ffffff" }, DET: { end: "#0076b6", ink: "#ffffff" },
  GB: { end: "#203731", ink: "#ffffff" }, MIN: { end: "#4f2683", ink: "#ffffff" },
  ATL: { end: "#a71930", ink: "#ffffff" }, CAR: { end: "#0085ca", ink: "#101820" },
  NO: { end: "#101820", ink: "#ffffff" }, TB: { end: "#d50a0a", ink: "#ffffff" },
  ARI: { end: "#97233f", ink: "#ffffff" }, LA: { end: "#003594", ink: "#ffffff" }, LAR: { end: "#003594", ink: "#ffffff" },
  SF: { end: "#aa0000", ink: "#ffffff" }, SEA: { end: "#002244", ink: "#ffffff" },
};

function Post({ edge, dir }: { edge: number; dir: -1 | 1 }) {
  const mid = 110;
  const upright = edge + dir * 8;
  return (
    <g stroke="#f0eee6" strokeWidth="1.4" fill="none">
      <line x1={edge} y1={mid} x2={upright} y2={mid} />
      <line x1={upright} y1={mid - 22} x2={upright} y2={mid + 22} />
    </g>
  );
}

export function Stadium({ home, away, team, name, plays }: { venue?: string; home: string; away: string; team?: string; name: string; rec: number; plays: Play[] }) {
  const [open, setOpen] = useState(0);
  useEffect(() => setOpen(0), [name, home, away]);
  const homeKey = home.toUpperCase();
  const awayKey = away.toUpperCase();
  const awaySkin = SKIN[awayKey] || { end: "#111", ink: "#f0eee6" };
  const homeSkin = SKIN[homeKey] || { end: "#111", ink: "#f0eee6" };
  const play = plays[open];
  const fieldX = 118;
  const fieldW = 760;
  return (
    <div style={{ background: "#0e0e0c", color: "#f0eee6" }}>
      <p className="text-sm">{name} · {plays.length} catches · {NAME[awayKey] || away} at {NAME[homeKey] || home}</p>
      <svg viewBox="0 0 1000 230" className="mt-2 w-full">
        <rect x="28" y="16" width="90" height="176" fill={awaySkin.end} />
        <rect x="878" y="16" width="90" height="176" fill={homeSkin.end} />
        <text x="73" y="108" fill={awaySkin.ink} fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90 73 108)">{NAME[awayKey] || awayKey}</text>
        <text x="923" y="108" fill={homeSkin.ink} fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(90 923 108)">{NAME[homeKey] || homeKey}</text>
        <rect x={fieldX} y="16" width={fieldW} height="176" fill="#1c6b34" />
        {Array.from({ length: 11 }, (_, i) => {
          const x = fieldX + (i / 10) * fieldW;
          const label = i <= 5 ? i * 10 : (10 - i) * 10;
          return (
            <g key={i}>
              <line x1={x} y1="16" x2={x} y2="192" stroke="#f0eee6" strokeWidth="0.8" opacity="0.7" />
              <text x={x} y="214" fill="#f0eee6" fontSize="11" textAnchor="middle" opacity="0.8">{label}</text>
            </g>
          );
        })}
        <Post edge={28} dir={-1} />
        <Post edge={968} dir={1} />
        {plays.map((p, i) => {
          const lane = p.loc === "left" ? 52 : p.loc === "right" ? 156 : 104;
          const y = lane + ((i % 3) - 1) * 10;
          const spot = p.x == null ? 8 + ((i * 17) % 84) : Number(p.x);
          const x = fieldX + (spot / 100) * fieldW;
          const on = open === i;
          return (
            <g key={i} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="14" fill="transparent" />
              <circle cx={x} cy={y} r={on ? 6 : 4} fill={on ? "#f0eee6" : "#8faf88"} />
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-sm text-muted">
        {play ? `vs ${play.def} · Q${play.qtr || "?"} ${play.time || ""} · ${ORD[Number(play.down)] || ""} & ${play.togo || "?"} · ${play.yards ?? "?"} yards` : "Tap a dot."}
      </p>
    </div>
  );
}
