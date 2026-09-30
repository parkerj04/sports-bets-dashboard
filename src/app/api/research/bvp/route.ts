import { NextResponse } from "next/server";
import { getBvP } from "@/lib/propdesk";
import { getZones } from "@/lib/zones";
import { getHitterLogs } from "@/lib/hitter-form";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const batterId = Number(q.get("batterId"));
  const pitcherId = Number(q.get("pitcherId"));
  const name = q.get("name") || "Batter";
  if (!batterId || !pitcherId) {
    return NextResponse.json({ error: "Need batterId and pitcherId" }, { status: 400 });
  }
  const [bvp, zones, form] = await Promise.all([
    getBvP(batterId, pitcherId, name),
    getZones(batterId, "hitting"),
    getHitterLogs(batterId, name),
  ]);
  return NextResponse.json({ bvp, zones, form });
}
