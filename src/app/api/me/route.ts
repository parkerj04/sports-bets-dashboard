import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null, isOwner: false });

  const owner = (process.env.OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || "")
    .trim()
    .toLowerCase();
  const isOwner = !!owner && (user.email || "").toLowerCase() === owner;
  return NextResponse.json({ email: user.email, isOwner });
}
