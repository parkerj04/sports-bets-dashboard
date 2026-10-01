import { NextResponse } from "next/server";
import seed from "@/data/agent-plays.json";

export const dynamic = "force-dynamic";

type Play = { id: string; game: string; away: string; home: string; pick: string; score: number; why: string };

async function live(): Promise<Play[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/agent_plays?select=id,game,away,home,pick,score,why&order=score.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = (q.get("away") || "").toUpperCase();
  const home = (q.get("home") || "").toUpperCase();
  const rows = (await live()) || (seed.plays as Play[]);
  const plays = rows.filter((p) => !away || (p.away === away && p.home === home) || (p.away === home && p.home === away));
  return NextResponse.json({ plays, note: "Agent desk. A posted play still needs a case against. 80 is not available from this route." });
}

export async function POST(request: Request) {
  const key = request.headers.get("x-agent-key") || "";
  if (!process.env.AGENT_KEY || key !== process.env.AGENT_KEY) {
    return NextResponse.json({ error: "Agent key required." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.pick || !body?.why) return NextResponse.json({ error: "pick and why are required" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ error: "Supabase service key is not set." }, { status: 501 });
  const res = await fetch(`${url}/rest/v1/agent_plays`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return NextResponse.json({ error: "Insert failed. Run the agent_plays SQL." }, { status: 502 });
  return NextResponse.json({ accepted: true });
}
