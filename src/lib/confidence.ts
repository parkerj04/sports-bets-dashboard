/** A 70 is rare. One pitcher line cannot print it. Wins do not raise the next score. */
export function grade(confirms: string[], flags: string[]): { score: number; why: string } {
  const c = confirms.filter(Boolean).slice(0, 5);
  const f = flags.filter(Boolean).slice(0, 5);
  let score = 46 + c.length * 6 - f.length * 9;
  if (f.length >= 1) score = Math.min(score, 64);
  if (f.length >= 2) score = Math.min(score, 58);
  if (score >= 70 && (c.length < 4 || f.length > 0)) score = 64;
  if (score >= 64 && c.length < 2) score = 58;
  score = Math.max(36, Math.min(78, Math.round(score)));
  const parts = [];
  if (c.length) parts.push(`Confirms (${c.length}): ${c.join("; ")}`);
  if (f.length) parts.push(`Flags (${f.length}, cap applied): ${f.join("; ")}`);
  if (!c.length && !f.length) parts.push("No independent confirms. Mid score only.");
  return { score, why: parts.join(" ") };
}
