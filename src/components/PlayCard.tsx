"use client";

import Link from "next/link";
import type { CfbSheet } from "@/lib/cfb-glance";

function implied(odds?: string) {
  const n = Number(String(odds || "").replace(/[^0-9+-]/g, ""));
  if (!Number.isFinite(n) || n === 0 || Math.abs(n) < 100) return null;
  const p = n > 0 ? 100 / (n + 100) : -n / (-n + 100);
  return Math.round(p * 1000) / 10;
}

function Cell({ value, rank, hot }: { value: string; rank?: string; hot: boolean }) {
  return (
    <td className="py-1.5 text-right font-mono">
      <span className={hot ? "text-good" : ""}>{value}</span>
      {rank ? <span className="ml-1 font-sans text-[10px] text-muted">{rank}</span> : null}
    </td>
  );
}

export function SeasonSheet({ sheet }: { sheet: CfbSheet }) {
  return (
    <div>
      <div className="text-[11px] tracking-widest text-muted uppercase">Season</div>
      <table className="mt-1 w-full text-xs">
        <thead>
          <tr className="text-[11px] text-muted">
            <th className="pb-1 text-left font-medium"> </th>
            <th className="pb-1 text-right font-medium">{sheet.away}</th>
            <th className="pb-1 text-right font-medium">{sheet.home}</th>
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row) => (
            <tr key={row.label} className="border-t border-card-border">
              <td className="py-1.5 pr-2 text-muted">{row.label}</td>
              <Cell value={row.away} rank={row.awayRank} hot={row.better === "away"} />
              <Cell value={row.home} rank={row.homeRank} hot={row.better === "home"} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] leading-snug text-muted">{sheet.note}</p>
    </div>
  );
}

export function PlayCard({
  href,
  kicker,
  title,
  price,
  when,
  line,
  fors,
  againsts,
  sheet,
}: {
  href: string;
  kicker: string;
  title: string;
  price?: string;
  when: string;
  line: string;
  fors: string[];
  againsts: string[];
  sheet?: CfbSheet | null;
}) {
  const pct = implied(price);
  return (
    <article className="rounded-2xl border border-card-border bg-card p-4">
      <div className="text-[11px] tracking-widest text-muted uppercase">{kicker}</div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h2 className="text-2xl leading-tight font-semibold tracking-tight">{title}{price ? ` ${price}` : ""}</h2>
        <span className="shrink-0 rounded-full bg-amber-950/40 px-2.5 py-1 text-[11px] font-medium text-amber-200">No proven edge</span>
      </div>
      <p className="mt-3 text-sm text-muted">{when}</p>
      <p className="mt-1 text-sm">{line}</p>
      {sheet ? <div className="mt-3"><SeasonSheet sheet={sheet} /></div> : null}
      {pct != null ? <p className="mt-3 font-mono text-sm">{pct}% implied by the price</p> : null}
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <div className="text-good">The case for</div>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {fors.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-danger">The case against</div>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
            {againsts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
      <Link href={href} className="mt-3 block text-sm text-accent">Open the game</Link>
    </article>
  );
}
