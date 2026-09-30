import { Bet, AuthState } from "./types";

const BETS_KEY = "sbd_bets_v1";
const AUTH_KEY = "sbd_auth_v1";
const PASSWORD_KEY = "sbd_password_v1";
const DEFAULT_PASSWORD = "bets123";

export function getBets(): Bet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBets(bets: Bet[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BETS_KEY, JSON.stringify(bets));
}

export function getAuth(): AuthState {
  if (typeof window === "undefined") {
    return { isLoggedIn: false, displayName: "" };
  }
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { isLoggedIn: false, displayName: "" };
  } catch {
    return { isLoggedIn: false, displayName: "" };
  }
}

export function setAuth(auth: AuthState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getStoredPassword(): string {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

export function setStoredPassword(pw: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASSWORD_KEY, pw);
}

export function logout(): void {
  setAuth({ isLoggedIn: false, displayName: "" });
}
