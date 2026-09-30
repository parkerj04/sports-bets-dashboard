"use client";

import type { ZoneCell } from "@/lib/zones";

const ORDER = [
  ["11", "12"],
  ["01", "02", "03"],
  ["04", "05", "06"],
  ["07", "08", "09"],
  ["13", "14"],
];

export function ZoneMap({ title, cells }: { title: string; cells: ZoneCell[] }) {
  const map = Object.fromEntries(cells.map((c) => [c.zone.replace(/^0/, "").padStart(2, "0"), c.value]));
  // also accept 1 vs 01
  const val = (z: string) => map[z] ?? map[z.replace(/^0/, "")] ?? 0;
  const nums = cells.map((c) => c.value);
  const max = Math.max(1, ...nums);

  function bg(z: string) {
    const v = val(z);
    const t = v / max;
    return `rgba(212,175,112,${0.12 + t * 0.75})`;
  }

  return (
    <div className="card p-4">
      <div className="text-xs text-muted uppercase tracking-wide mb-3">{title}</div>
      <div className="space-y-1 max-w-[220px] mx-auto">
        <div className="grid grid-cols-2 gap-1">
          {ORDER[0].map((z) => (
            <Cell key={z} z={z} v={val(z)} bg={bg(z)} chase />
          ))}
        </div>
        {ORDER.slice(1, 4).map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-1">
            {row.map((z) => (
              <Cell key={z} z={z} v={val(z)} bg={bg(z)} />
            ))}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-1">
          {ORDER[4].map((z) => (
            <Cell key={z} z={z} v={val(z)} bg={bg(z)} chase />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted text-center mt-2">Hot = more pitches / more action in that box</p>
    </div>
  );
}

function Cell({ z, v, bg, chase }: { z: string; v: number; bg: string; chase?: boolean }) {
  return (
    <div className={`rounded-sm text-center py-2 ${chase ? "opacity-80" : ""}`} style={{ background: bg }}>
      <div className="text-[9px] text-muted">{z}</div>
      <div className="font-mono text-xs">{Math.round(v)}</div>
    </div>
  );
}
