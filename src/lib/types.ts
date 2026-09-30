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
  sport: Sport;
  event: string;
  selection: string;
  odds: number;
  stake: number;
  book?: string;
  notes?: string;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
  isPublic: boolean;
}

export interface AuthState {
  isLoggedIn: boolean;
  displayName: string;
}

export function americanToDecimal(odds: number): number {
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

export function potentialPayout(stake: number, odds: number): number {
  return stake * americanToDecimal(odds);
}

export function profitIfWon(stake: number, odds: number): number {
  return potentialPayout(stake, odds) - stake;
}
