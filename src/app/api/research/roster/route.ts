import { NextResponse } from "next/server";
import { mlbRoster, nflRoster } from "@/lib/roster";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const sport = q.get("sport") || "";
  try {
    if (sport === "nfl") {
      const [away, home] = await Promise.all([
        nflRoster(q.get("awayAbbr") || "", q.get("away") || "Away"),
        nflRoster(q.get("homeAbbr") || "", q.get("home") || "Home"),
      ]);
      return NextResponse.json({ away, home, rule: "A player counts only if this public roster still lists him today. A trade is not active until the new team feed shows him." });
    }
    if (sport === "mlb") {
      const [away, home] = await Promise.all([
        mlbRoster(Number(q.get("awayId") || 0), q.get("away") || "Away"),
        mlbRoster(Number(q.get("homeId") || 0), q.get("home") || "Home"),
      ]);
      return NextResponse.json({ away, home, rule: "Active MLB roster from the Stats API. A bat or arm not on this list is not confirmed." });
    }
    return NextResponse.json({ error: "Missing sport" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Roster check failed" }, { status: 500 });
  }
}
