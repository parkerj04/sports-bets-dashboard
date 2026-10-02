import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing pick." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceKey();
  if (!url || !key) return NextResponse.json({ error: "Share is not set on this deploy." }, { status: 501 });
  const res = await fetch(`${url}/rest/v1/picks?id=eq.${encodeURIComponent(body.id)}&user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ is_public: Boolean(body.isPublic) }),
  });
  if (!res.ok) return NextResponse.json({ error: "Could not share that pick." }, { status: 502 });
  const rows = await res.json();
  if (!rows?.length) return NextResponse.json({ error: "That pick is not on your account." }, { status: 404 });
  return NextResponse.json({ ok: true, isPublic: Boolean(body.isPublic) });
}
