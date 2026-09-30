"use client";
import type { HitterLog } from "@/lib/hitter-form";

export function HitterForm({ rows }: { rows: HitterLog[] }) {
  if (!rows?.length) return null;
  return (
    <div className="card p-4 overflow-x-auto">
      <h3 className="font-semibold text-sm mb-2">Last 5 games — hitters</h3>
      <table className="w-full text-xs">
        <thead className="text-muted">
          <tr className="text-left">
            <th className="pb-2">Batter</th>
            <th>L5 H</th>
            <th>L5 AB</th>
            <th>L5 HR</th>
            <th>Line</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-card-border">
              <td className="py-1.5 pr-2 font-medium">{r.name}</td>
              <td className="font-mono">{r.l5h}</td>
              <td className="font-mono">{r.l5ab}</td>
              <td className="font-mono">{r.l5hr}</td>
              <td className="font-mono text-[10px] text-muted">
                {r.games.map((g) => `${g.h}/${g.ab}`).join(" · ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
