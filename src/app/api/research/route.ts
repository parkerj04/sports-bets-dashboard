import { NextResponse } from "next/server";
import { findTodaysEdges, getTodaysGames } from "@/lib/mlb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;
  try {
    const games = await getTodaysGames(date);
    const edges = await findTodaysEdges(date);
    return NextResponse.json({ edges, games, date: date || "today" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch research data", edges: [], games: [] }, { status: 500 });
  }
}
