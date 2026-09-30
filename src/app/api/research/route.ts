import { NextResponse } from "next/server";
import { findTodaysEdges, getTodaysGames } from "@/lib/mlb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;

  try {
    const [edges, games] = await Promise.all([
      findTodaysEdges(date),
      getTodaysGames(date),
    ]);
    return NextResponse.json({ edges, games, date: date || "today" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch research data", edges: [], games: [] },
      { status: 500 }
    );
  }
}
