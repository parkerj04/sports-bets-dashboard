import { NextResponse } from "next/server";
import seed from "@/data/agent-plays.json";

export const dynamic = "force-dynamic";

type Play = { id: string; game: string; away: string; home: string; pick: string; score: number; why: string };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const plays = (seed.plays as Play[]).filter((p) => !away || (p.away === away && p.home === home) || (p.away === home && p.home === away));
  return NextResponse.json({ plays, note: "Agent desk. A posted play still needs a case against. 80 is not available from this route." });
}

export async function POST(request: Request) {
  const key = request.headers.get("x-agent-key") || "";
  if (!process.env.AGENT_KEY || key !== process.env.AGENT_KEY) {
    return NextResponse.json({ error: "Agent key required. Set AGENT_KEY in Vercel, then send it in x-agent-key." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.pick || !body?.why) return NextResponse.json({ error: "pick and why are required" }, { status: 400 });
  return NextResponse.json({
    accepted: false,
    error: "Key is valid. Persistence needs the agent_plays table. Run the SQL in research-agent.md, then this route can insert.",
  }, { status: 501 });
}
