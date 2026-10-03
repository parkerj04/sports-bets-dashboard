export function ModelCall({ away, home, spread, total }: { away: string; home: string; spread: string; total: string | number }) {
  const ou = typeof total === "number" ? total : parseFloat(String(total));
  if (!ou) return <p className="text-xs text-muted">No posted total, so there is no model score.</p>;
  const raw = String(spread || "");
  const line = Math.abs(parseFloat((raw.match(/-?\d+(?:\.\d+)?/) || ["0"])[0]));
  const homeToken = home.toLowerCase().split(" ").pop() || "";
  const awayToken = away.toLowerCase().split(" ").pop() || "";
  const text = raw.toLowerCase();
  const homeFav = text.includes(homeToken) ? text.includes("-") : text.includes(awayToken) ? false : text.trim().startsWith("-");
  const homeScore = Math.round(homeFav ? (ou + line) / 2 : (ou - line) / 2);
  const awayScore = Math.round(ou - homeScore);
  const confidence = line >= 14 ? 64 : line >= 7 ? 58 : line >= 3 ? 54 : 51;
  const tag = (name: string) => name.split(" ").pop()?.slice(0, 4).toUpperCase();
  return (
    <div className="rounded-lg border border-card-border bg-white/5 px-3 py-2 text-xs">
      <div className="flex justify-between gap-2">
        <span className="text-muted">Model score</span>
        <span className="font-mono font-semibold">{tag(away)} {awayScore} {tag(home)} {homeScore}</span>
      </div>
      <div className="flex justify-between gap-2 mt-1">
        <span className="text-muted">Model total</span>
        <span className="font-mono">{awayScore + homeScore}</span>
      </div>
      <div className="flex justify-between gap-2 mt-1">
        <span className="text-muted">Confidence</span>
        <span className="font-mono">{confidence}</span>
      </div>
      <p className="text-[11px] text-muted mt-1">Straight score from the posted number. Not a private model, and not a bet.</p>
    </div>
  );
}
