"use client";

import { useEffect, useState } from "react";

type Play = {
  week: string; def: string; loc: string; length?: string;
  yards: number | null; air?: number | null; yac?: number | null; td?: boolean; desc?: string;
  qtr?: string; time?: string; down?: string; togo?: string; from?: string; to?: string;
  x?: number | null; coverage?: string; concept?: string;
};

const COLORS = ["#2f6fed", "#e23b3b", "#f08a24", "#c084fc", "#3dd68c", "#1aa7c7", "#d4b24a", "#d4537e"];
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
  PIT: { end: "#0a0a0a", ink: "#ffb612" }, CLE: { end: "#3a2a1a", ink: "#ff6a1a" },
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

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name;
  const initial = parts[0].replace(/\./g, "")[0] || "";
  const last = parts.slice(1).join("").replace(/\s/g, "");
  return `${initial}.${last}`;
}

function clean(value?: string) {
  return (value || "").replace(/^estimate:\s*/i, "").trim();
}

function explain(play: Play): [string, string][] {
  const coverage = clean(play.coverage);
  const concept = clean(play.concept);
  const down = ORD[Number(play.down)] || "";
  const routeBits = [play.length, play.loc && `thrown ${play.loc}`].filter(Boolean);
  if (play.air != null) routeBits.push(`${play.air} air yards`);
  if (play.yac != null) routeBits.push(`${play.yac} after the catch`);
  const route = routeBits.length ? routeBits.join(", ") : "Route not in the play file.";
  const possible = concept && !/not enough/i.test(concept)
    ? `${concept}. Estimate from the throw, not a charted call.${play.desc ? ` Log: ${play.desc}` : ""}`
    : play.desc || "Not enough on the play to name it.";
  const why: string[] = [];
  if (down && play.togo) why.push(`${down} and ${play.togo}`);
  if (play.from) why.push(`the ball was at ${play.from}`);
  if ((play.air ?? 0) >= 16 || play.length === "deep") why.push("the throw was down the field");
  else if (play.air != null && play.air <= 3) why.push("the throw was at the line");
  if ((play.yac ?? 0) >= 10) why.push(`${play.yac} yards came after the catch, so the gain lived on the run`);
  else if (play.yac != null && play.yac <= 1 && (play.yards ?? 0) > 0) why.push("almost none of the gain came after the catch");
  if (play.td) why.push("it scored");
  else if (play.yards != null) why.push(`the catch was worth ${play.yards}`);
  if (play.to) why.push(`the spot on the field is the end of the catch, ${play.to}`);
  return [
    ["Coverage", !coverage || /not enough/i.test(coverage) ? "Not charted." : `${coverage}. Estimate from the play shape, not film.`],
    ["Route", route],
    ["Possible play", possible],
    ["Why", why.length ? `${why.join(". ")}.` : "Not enough on the play to say why it was there."],
  ];
}

function Post({ edge, dir, mid }: { edge: number; dir: -1 | 1; mid: number }) {
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
  const homeLogo = `https://a.espncdn.com/i/teamlogos/nfl/500/${homeKey.toLowerCase()}.png`;
  const awaySkin = SKIN[awayKey] || { end: "#111", ink: "#ffffff" };
  const homeSkin = SKIN[homeKey] || { end: "#111", ink: "#ffffff" };
  const clubSkin = SKIN[club] || awaySkin;
  const play = plays[open];
  const fieldX = 130;
  const fieldW = 740;
  const midY = 118;
  const rows = play ? explain(play) : [];
  return (
    <div className="overflow-hidden bg-black text-white">
      <div className="flex items-center gap-3 px-3 py-4">
        <img src={playerLogo} alt="" className="size-16 shrink-0 rounded-full bg-white object-contain p-1.5" />
        <div className="min-w-0">
          <p className="text-[22px] leading-none font-extrabold tracking-tight" style={{ color: clubSkin.ink }}>
            {shortName(name || "Player")} · {NAME[club] || club}
          </p>
          <p className="mt-1 text-2xl leading-none font-extrabold text-white">— 2026</p>
          <p className="mt-2 text-[15px] leading-snug text-white/70">
            {NAME[awayKey] || away} at {NAME[homeKey] || home}
            {venue ? ` · ${venue}` : ""}
          </p>
        </div>
      </div>
      <div className="h-1.5" style={{ background: homeSkin.ink === "#ffffff" ? homeSkin.end : homeSkin.ink }} />
      <svg viewBox="0 0 1040 270" className="w-full bg-[#1f7a34]">
        <rect x="36" y="14" width="94" height="200" fill={awaySkin.end} stroke="#fff" strokeWidth="2" />
        <rect x="870" y="14" width="94" height="200" fill={homeSkin.end} stroke="#fff" strokeWidth="2" />
        <text x="83" y="118" fill={awaySkin.ink} fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="1.5" transform="rotate(-90 83 118)">{NAME[awayKey] || awayKey}</text>
        <text x="917" y="118" fill={homeSkin.ink} fontSize="13" fontWeight="800" textAnchor="middle" letterSpacing="1.5" transform="rotate(90 917 118)">{NAME[homeKey] || homeKey}</text>
        <rect x={fieldX} y="14" width={fieldW} height="200" fill="#21863c" stroke="#fff" strokeWidth="2" />
        {Array.from({ length: 21 }, (_, i) => fieldX + (i / 20) * fieldW).map((x, i) => (
          <line key={i} x1={x} y1="14" x2={x} y2="214" stroke="#fff" strokeWidth={i % 2 === 0 ? 1.6 : 0.6} />
        ))}
        {Array.from({ length: 20 }, (_, i) => fieldX + ((i + 0.5) / 20) * fieldW).map((x) => (
          <g key={x}>
            <line x1={x - 8} y1="72" x2={x + 8} y2="72" stroke="#fff" strokeWidth="1.5" />
            <line x1={x - 8} y1="156" x2={x + 8} y2="156" stroke="#fff" strokeWidth="1.5" />
          </g>
        ))}
        {Array.from({ length: 11 }, (_, i) => {
          const x = fieldX + (i / 10) * fieldW;
          const label = i <= 5 ? i * 10 : (10 - i) * 10;
          return <text key={i} x={x} y="248" fill="#fff" fontSize="15" fontWeight="700" textAnchor="middle">{label}</text>;
        })}
        <Post edge={36} dir={-1} mid={midY} />
        <Post edge={964} dir={1} mid={midY} />
        <circle cx={fieldX + fieldW / 2} cy={midY} r="26" fill="#111" opacity="0.35" />
        <image href={homeLogo} x={fieldX + fieldW / 2 - 18} y={midY - 18} width="36" height="36" />
        {plays.map((p, i) => {
          const lane = p.loc === "left" ? 52 : p.loc === "right" ? 176 : midY;
          const y = Math.max(32, Math.min(196, lane + ((i % 5) - 2) * 8));
          const spot = p.x == null ? 8 + ((i * 17) % 84) : Number(p.x);
          const x = fieldX + (Math.min(96, Math.max(4, spot)) / 100) * fieldW;
          const on = open === i;
          return (
            <g key={i} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="16" fill="transparent" />
              <circle cx={x} cy={y} r={on ? 13 : 10} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={on ? 2.5 : 1.2} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <div className="px-3 pt-3 text-sm">
        {play ? (
          <p>
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: COLORS[open % COLORS.length] }}>{open + 1}</span>
            vs {play.def} · Q{play.qtr || "?"} {play.time || ""} · {ORD[Number(play.down)] || "?"} & {play.togo || "?"} · {play.yards ?? "?"} yards
          </p>
        ) : (
          <p className="text-white/60">{rec ? `${rec} catches. Tap a dot.` : "Tap a dot."}</p>
        )}
      </div>
      {rows.length > 0 ? (
        <table className="mx-3 mt-3 mb-3 w-[calc(100%-1.5rem)] border-collapse text-sm">
          <tbody>
            {rows.map(([label, figure]) => (
              <tr key={label} className="border-t border-white/15 align-top">
                <th className="w-28 py-2.5 pr-3 text-left text-xs font-normal tracking-wide text-white/50">{label}</th>
                <td className="py-2.5 text-left leading-snug text-white">{figure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
