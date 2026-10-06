import { NextResponse } from "next/server";
import { getNflCard } from "@/lib/nfl";
import { getNflLab, type NflLab } from "@/lib/nfl-game";
import { nflTicket } from "@/lib/nfl-context";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function stub(card: { id: string; name: string; date: string; status: string; venue: string; home: string; away: string; spread: string; total: string | number; mlHome: string; mlAway: string }): NflLab {
  const abbr = (name: string) => {
    const last = name.split(" ").pop() || "";
    const map: Record<string, string> = { Commanders: "WAS", Patriots: "NE", Jets: "NYJ", Giants: "NYG", Forty: "SF", "49ers": "SF", Buccaneers: "TB", Cowboys: "DAL" };
    return map[last] || last.slice(0, 3).toUpperCase();
  };
  return {
    id: card.id,
    name: card.name,
    date: card.date,
    status: card.status,
    venue: card.venue,
    home: card.home,
    away: card.away,
    homeAbbr: abbr(card.home),
    awayAbbr: abbr(card.away),
    spread: card.spread,
    total: String(card.total),
    mlHome: card.mlHome,
    mlAway: card.mlAway,
    stats: [],
    injuries: [],
    leaders: [],
    lastFive: [],
  };
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const [card, labRaw] = await Promise.all([getNflCard(id), getNflLab(id)]);
    const lab = labRaw || (card ? stub(card) : null);
    if (!lab) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const ticket = card ? nflTicket(card, lab) : null;
    return NextResponse.json({ lab, card, ticket });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load NFL game" }, { status: 500 });
  }
}
