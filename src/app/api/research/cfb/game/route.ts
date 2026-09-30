import { NextResponse } from "next/server";
import { getCfbGame } from "@/lib/cfb";
import { getCfbLab } from "@/lib/cfb-lab";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const [game, lab] = await Promise.all([getCfbGame(id), getCfbLab(id)]);
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  return NextResponse.json({ game, lab });
}
