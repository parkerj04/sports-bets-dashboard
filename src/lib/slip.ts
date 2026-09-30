export type SlipItem = {
  id: string;
  sport: string;
  game: string;
  market: string;
  pick: string;
  score: number;
  why: string;
  playable: boolean;
};

const KEY = "locksmith_slip_v1";

export function loadSlip(): SlipItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSlip(items: SlipItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function slipText(items: SlipItem[]) {
  return items
    .map((x, i) => `${i + 1}. ${x.pick}\n${x.game} · ${x.market} · score ${x.score}${x.playable ? "" : " · RESEARCH ONLY"}`)
    .join("\n\n");
}
