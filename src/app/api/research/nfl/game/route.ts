import { NextResponse } from "next/server";
import { getNflWeek } from "@/lib/nfl";
import { getNflLab } from "@/lib/nfl-game";
import { nflTicket } from "@/lib/nfl-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const [lab, week] = await Promise.all([getNflLab(id), getNflWeek()]);
    if (!lab) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const card = week.games.find((g) => g.id === id) || null;
    const ticket = card ? nflTicket(card, lab) : null;
    return NextResponse.json({ lab, card, ticket });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load NFL game" }, { status: 500 });
  }
}
