"use client";

import type { ZoneCell } from "@/lib/zones";

const ORDER = [
  ["11", "12"],
  ["01", "02", "03"],
  ["04", "05", "06"],
  ["07", "08", "09"],
  ["13", "14"],
];

function fmt(v: number, kind: "count" | "avg" | "slg") {
  if (!v && v !== 0) return "—";
  if (kind === "count") return String(Math.round(v));
  if (v >= 1) return v.toFixed(3).replace(/^0/, "");
  return v.toFixed(3).replace(/^0/, "");
}

export function ZoneMap({
  title,
  cells,
  kind = "count",
}: {
  title: string;
  cells: ZoneCell[];
  kind?: "count" | "avg" | "slg";
}) {
  const map: Record<string, number> = {};
  for (const c of cells) {
    const z = String(c.zone).padStart(2, "0");
    map[z] = c.value;
  }
  const val = (z: string) => map[z] ?? map[z.replace(/^0/, "")] ?? 0;
  const nums = cells.map((c) => c.value);
  const max = Math.max(kind === "count" ? 1 : 0.001, ...nums);

  function bg(z: string) {
    const v = val(z);
    const t = Math.min(1, v / max);
    return `rgba(212,175,112,${0.1 + t * 0.8})`;
  }

  if (!cells.length) {
    return (
      <div className="card p-4">
        <div className="text-xs text-muted uppercase tracking-wide mb-2">{title}</div>
        <p className="text-xs text-muted">No zone sample for this player yet.</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="text-xs text-muted uppercase tracking-wide mb-3">{title}</div>
      <div className="space-y-1 max-w-[240px] mx-auto">
        <div className="grid grid-cols-2 gap-1">
          {ORDER[0].map((z) => (
            <Cell key={z} z={z} v={val(z)} bg={bg(z)} kind={kind} chase />
          ))}
        </div>
        {ORDER.slice(1, 4).map((row, i) => (
          <div key={i} className="grid grid-cols-3 gap-1">
            {row.map((z) => (
              <Cell key={z} z={z} v={val(z)} bg={bg(z)} kind={kind} />
            ))}
          </div>
        ))}
        <div className="grid grid-cols-2 gap-1">
          {ORDER[4].map((z) => (
            <Cell key={z} z={z} v={val(z)} bg={bg(z)} kind={kind} chase />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted text-center mt-2">
        Catcher view. Middle 9 boxes = strike zone. Gold = hotter.
      </p>
    </div>
  );
}

function Cell({
  z, v, bg, kind, chase,
}: {
  z: string; v: number; bg: string; kind: "count" | "avg" | "slg"; chase?: boolean;
}) {
  return (
    <div className={`rounded-sm text-center py-2 ${chase ? "opacity-80" : ""}`} style={{ background: bg }}>
      <div className="text-[9px] text-muted">{z}</div>
      <div className="font-mono text-[11px]">{fmt(v, kind)}</div>
    </div>
  );
}
