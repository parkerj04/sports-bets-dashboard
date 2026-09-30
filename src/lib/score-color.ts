export function scoreTone(score: number) {
  if (score >= 75) return "text-good";
  if (score >= 60) return "text-warning";
  return "text-danger";
}
