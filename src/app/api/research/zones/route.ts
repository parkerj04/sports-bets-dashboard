import { NextResponse } from "next/server";
import { getZones } from "@/lib/zones";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const group = (searchParams.get("group") || "pitching") as "pitching" | "hitting";
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    return NextResponse.json(await getZones(id, group));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "zones failed" }, { status: 500 });
  }
}
