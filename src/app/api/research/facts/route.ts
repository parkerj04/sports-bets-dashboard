import { NextResponse } from "next/server";
import { askFrom, deskFacts } from "@/lib/facts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const ask = askFrom(new URL(request.url).searchParams);
  if (!ask.sport || !ask.away || !ask.home) return NextResponse.json({ open: null, situation: null, crew: null });
  try {
    return NextResponse.json(await deskFacts(ask));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ open: null, situation: null, crew: null });
  }
}
