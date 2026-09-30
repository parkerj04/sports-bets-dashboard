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
      .then((d) => setCells(d.pitches?.length ? d.pitches : d.strikes || []))
      .catch(() => setCells([]));
  }, [id]);
  if (!id) return null;
  if (!cells) return <p className="text-xs text-muted">Loading zone map…</p>;
  if (!cells.length) return <p className="text-xs text-muted">No pitch-location sample yet.</p>;
  return <ZoneMap title={`${name} — where he attacks`} cells={cells} kind="count" />;
}

export function BatterZones({ id, name }: { id?: number | null; name: string }) {
  const [avg, setAvg] = useState<ZoneCell[] | null>(null);
  const [slg, setSlg] = useState<ZoneCell[] | null>(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/research/zones?id=${id}&group=hitting`)
      .then((r) => r.json())
      .then((d) => {
        setAvg(d.avg || []);
        setSlg(d.slg || d.ops || []);
      })
      .catch(() => {
        setAvg([]);
        setSlg([]);
      });
  }, [id]);
  if (!id) return null;
  if (!avg) return <p className="text-xs text-muted">Loading batter zones…</p>;
  return (
    <div className="space-y-3">
      <ZoneMap title={`${name} — AVG by zone`} cells={avg} kind="avg" />
      <ZoneMap title={`${name} — SLG / damage by zone`} cells={slg || []} kind="slg" />
    </div>
  );
}
