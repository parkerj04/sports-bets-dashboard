import { NextResponse } from "next/server";
import scheme from "@/data/nfl-scheme-2026.json";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const teams = scheme.teams as Record<string, Record<string, number>>;
  return NextResponse.json({ source: scheme.source, away: teams[away] || null, home: teams[home] || null });
}
