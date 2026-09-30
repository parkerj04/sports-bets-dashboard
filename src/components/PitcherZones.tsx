"use client";
import { useEffect, useState } from "react";
import { ZoneMap } from "@/components/ZoneMap";
import type { ZoneCell } from "@/lib/zones";

export function PitcherZones({ id, name }: { id?: number | null; name: string }) {
  const [cells, setCells] = useState<ZoneCell[] | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/research/zones?id=${id}&group=pitching`)
      .then((r) => r.json())
      .then((d) => setCells(d.strikes || []))
      .catch(() => setCells([]));
  }, [id]);
  if (!id) return null;
  if (!cells) return <p className="text-xs text-muted">Loading zone map…</p>;
  return <ZoneMap title={`${name} — where he attacks`} cells={cells} />;
}

export function BatterZones({ id, name }: { id?: number | null; name: string }) {
  const [cells, setCells] = useState<ZoneCell[] | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/research/zones?id=${id}&group=hitting`)
      .then((r) => r.json())
      .then((d) => setCells(d.strikes || d.raw?.battingAverage || []))
      .catch(() => setCells([]));
  }, [id]);
  if (!id) return null;
  if (!cells) return null;
  return <ZoneMap title={`${name} — damage / activity zones`} cells={cells} />;
}
