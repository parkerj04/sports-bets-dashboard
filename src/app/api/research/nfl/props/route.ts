import { NextResponse } from "next/server";
import { recProps } from "@/lib/props";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const props = await recProps(q.get("away") || "", q.get("home") || "");
  return NextResponse.json({ source: "nflverse 2026 and 2025 play-by-play. Line is the player's own median, not a posted book number.", props });
}
