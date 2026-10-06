import { NextResponse } from "next/server";
import { gameScorers } from "@/lib/scorers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  if (!away || !home) return NextResponse.json({ error: "Missing teams" }, { status: 400 });
  try {
    return NextResponse.json(await gameScorers(away, home));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ source: "Scorer file did not load.", players: [] });
  }
}
