"use client";

import { useEffect, useState } from "react";
import type { DeskFacts } from "@/lib/facts";

export type FactsQuery = {
  sport: string;
  away: string;
  home: string;
  awayAbbr?: string;
  homeAbbr?: string;
  awayId?: number;
  homeId?: number;
  awayPitcherId?: number;
  homePitcherId?: number;
  awayPitcher?: string;
  homePitcher?: string;
};

export function useDeskFacts(q: FactsQuery | null) {
  const [facts, setFacts] = useState<DeskFacts | null>(null);
  const key = JSON.stringify(q);
  useEffect(() => {
    const query = JSON.parse(key) as FactsQuery | null;
    if (!query?.away || !query.home) return;
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (value != null && value !== "") params.set(name, String(value));
    }
    let live = true;
    setFacts(null);
    fetch(`/api/research/facts?${params}`)
      .then((r) => r.json())
      .then((data) => { if (live && data && !data.error) setFacts(data); })
      .catch(() => {});
    return () => { live = false; };
  }, [key]);
  return facts;
}

export function FactLine({ text }: { text?: string | null }) {
  if (!text) return null;
  return <p className="text-sm text-muted">{text}</p>;
}
