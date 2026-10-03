"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Item = { id: string; href: string; label: string };

export function GamePager() {
  const path = usePathname();
  const id = useSearchParams().get("id") || "";
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    if (!id || !path.includes("/game")) return;
    const sport = path.includes("/nfl/") ? "nfl" : path.includes("/cfb/") ? "cfb" : "mlb";
    const url = sport === "nfl" ? "/api/research/nfl" : sport === "cfb" ? "/api/research/cfb" : "/api/research?slate=1";
    fetch(url).then((r) => r.json()).then((d) => {
      const games = d.games || [];
      setItems(games.map((g: { id?: string; gamePk?: number; away?: string; home?: string; awayTeam?: string; homeTeam?: string }) => {
        const gid = String(g.id || g.gamePk || "");
        const href = sport === "nfl" ? `/research/nfl/game?id=${gid}` : sport === "cfb" ? `/research/cfb/game?id=${gid}` : `/research/game?id=${gid}`;
        return { id: gid, href, label: `${g.away || g.awayTeam || ""} at ${g.home || g.homeTeam || ""}` };
      }).filter((g: Item) => g.id));
    }).catch(() => setItems([]));
  }, [path, id]);
  if (!id || items.length < 2) return null;
  const i = items.findIndex((g) => g.id === id);
  if (i < 0) return null;
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];
  return (
    <>
      <Link href={prev.href} aria-label={`Previous game, ${prev.label}`} className="fixed bottom-6 left-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-card-border bg-background/95 text-xl shadow-lg">←</Link>
      <Link href={next.href} aria-label={`Next game, ${next.label}`} className="fixed bottom-6 right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-card-border bg-background/95 text-xl shadow-lg">→</Link>
    </>
  );
}
