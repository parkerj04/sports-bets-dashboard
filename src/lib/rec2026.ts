function reads(loc: string, length: string, air: number | null, yac: number | null, down: string, togo: string) {
  const a = air ?? 8;
  const y = yac ?? 0;
  const thirdShort = down === "3" && Number(togo) <= 4;
  if (y >= 15 && a <= 8) return { coverage: "estimate: single-high zone or man-match", concept: "estimate: leak / over route with run-after-catch" };
  if (length === "deep" || a >= 16) return { coverage: "estimate: single-high zone or man", concept: `estimate: vertical ${loc || "shot"}` };
  if (thirdShort && loc === "left") return { coverage: "estimate: zone-match", concept: "estimate: short left out / sideline breaker" };
  if (loc === "middle" && a >= 4 && a <= 12) return { coverage: "estimate: zone, Cover 2/3 shell", concept: "estimate: short seam / hook over middle" };
  if (loc === "right" && a <= 4) return { coverage: "estimate: zone", concept: "estimate: quick right flat / checkdown" };
  if (loc === "left" && a <= 4) return { coverage: "estimate: zone", concept: "estimate: quick left flat / checkdown" };
  if (loc === "middle") return { coverage: "estimate: zone", concept: "estimate: settle / hook over middle" };
  if (loc === "right") return { coverage: "estimate: zone", concept: "estimate: short right outlet" };
  if (loc === "left") return { coverage: "estimate: zone", concept: "estimate: short left out" };
  return { coverage: "estimate: not enough on the play", concept: "estimate: not enough on the play" };
}
