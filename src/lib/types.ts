export type BetStatus = "pending" | "won" | "lost" | "push" | "void";

export type Sport =
  | "NFL"
  | "NBA"
  | "MLB"
  | "NHL"
  | "NCAAF"
  | "NCAAB"
  | "Soccer"
  | "UFC"
  | "Tennis"
  | "Golf"
  | "Other";

export interface Bet {
  id: string;
  user_id: string;
  sport: Sport;
  event: string;
  selection: string;
  odds: number;
  stake: number;
  book?: string | null;
  notes?: string | null;
  research?: string | null;
  status: BetStatus;
  is_public: boolean;
  placed_at: string;
  settled_at?: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  is_owner: boolean;
  created_at: string;
}

export interface ResearchEdge {
  id: string;
  game: string;
  market: string;
  pick: string;
  edge_score: number;
  reasoning: string;
  pitcher?: string;
  team?: string;
  stats: Record<string, string | number>;
  date: string;
}

export function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

export function profitIfWon(stake: number, odds: number): number {
  return stake * americanToDecimal(odds) - stake;
}
