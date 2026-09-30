/** An 80 is earned. One good number cannot print it. */
export function grade(confirms: string[], flags: string[]): { score: number; why: string } {
  const c = confirms.filter(Boolean).slice(0, 5);
  const f = flags.filter(Boolean).slice(0, 5);
  let score = 48 + c.length * 7 - f.length * 8;
  if (f.length >= 1) score = Math.min(score, 72);
  if (f.length >= 2) score = Math.min(score, 64);
  if (score >= 80 && (c.length < 3 || f.length > 0)) score = 72;
  if (score >= 75 && (c.length < 2 || f.length > 0)) score = 71;
  score = Math.max(38, Math.min(88, Math.round(score)));
  const parts = [];
  if (c.length) parts.push(`Confirms (${c.length}): ${c.join("; ")}`);
  if (f.length) parts.push(`Flags (${f.length}, cap applied): ${f.join("; ")}`);
  if (!c.length && !f.length) parts.push("No independent confirms. Mid score only.");
  return { score, why: parts.join(" ") };
}
