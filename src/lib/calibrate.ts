import lessons from "@/data/desk-lessons.json";

export type Lesson = {
  id: string;
  market: string;
  result: "loss" | "win" | "push";
  flaw: string;
  rule: string;
};

export function activeLessons(): Lesson[] {
  return lessons as Lesson[];
}

export function lessonFlags(market: string): string[] {
  return activeLessons()
    .filter((l) => l.result === "loss" && l.market === market)
    .map((l) => `lesson ${l.id}`);
}

export function lessonLine(market: string): string {
  const hits = activeLessons().filter((l) => l.market === market && l.result === "loss");
  if (!hits.length) return "";
  return `Lesson on file: ${hits.map((l) => l.rule).join(" ")}`;
}

export const REVIEW_TAGS = [
  "process flaw: contact",
  "process flaw: lineup",
  "process flaw: price",
  "process flaw: weather",
  "process sound: variance",
] as const;
