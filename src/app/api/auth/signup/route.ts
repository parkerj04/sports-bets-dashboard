import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function norm(s: string) {
  return s.trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const displayName = String(body?.displayName || "");
  const code = String(body?.code || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const owner = norm(process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || "");
  const invite = String(process.env.INVITE_CODE || "").trim();
  const isOwner = owner && norm(email) === owner;

  if (!isOwner) {
    if (!invite) {
      return NextResponse.json({ error: "Invites are closed. Ask the owner for access." }, { status: 403 });
    }
    if (code.trim() !== invite) {
      return NextResponse.json({ error: "Wrong invite code." }, { status: 403 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || email.split("@")[0] } },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    needsConfirm: !data.session,
    message: data.session ? "ok" : "Check your email to confirm, then sign in.",
  });
}
