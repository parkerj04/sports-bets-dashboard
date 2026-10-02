import { NextResponse } from "next/server";
import { backs2026 } from "@/lib/backs2026";

export const dynamic = "force-dynamic";

const FILE: Record<string, string> = { WSH: "WAS", LAR: "LA" };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const away = FILE[(q.get("away") || "").toUpperCase()] || (q.get("away") || "").toUpperCase();
  const home = FILE[(q.get("home") || "").toUpperCase()] || (q.get("home") || "").toUpperCase();
  const live = await backs2026([away, home]);
  return NextResponse.json(live);
}
