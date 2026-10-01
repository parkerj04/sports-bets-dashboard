import { NextResponse } from "next/server";
import seed from "@/data/agent-plays.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Cron secret required." }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return NextResponse.json({ posted: 0, note: "No service key. Desk is still reading the seeded file." });
  const res = await fetch(`${url}/rest/v1/agent_plays`, {
    method: "POST",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(seed.plays),
  });
  if (!res.ok) return NextResponse.json({ error: "Table missing. Run the agent_plays SQL once." }, { status: 502 });
  return NextResponse.json({ posted: seed.plays.length });
}
