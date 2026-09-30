"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, setAuth, getStoredPassword } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Me");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    if (auth.isLoggedIn) {
      router.replace("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const stored = getStoredPassword();
    if (password === stored) {
      setAuth({ isLoggedIn: true, displayName: displayName.trim() || "Me" });
      router.push("/dashboard");
    } else {
      setError("Wrong password. Default is bets123");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sports Bets</h1>
          <p className="text-muted mt-1 text-sm">Track your plays. Share with friends.</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4 shadow-xl shadow-black/40">
          <div>
            <label className="block text-sm text-muted mb-1.5">Display name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full py-2.5 text-sm">
            Sign in
          </button>

          <p className="text-xs text-muted text-center pt-1">
            Default password: <code className="text-accent">bets123</code>
            <br />
            Change it later in Settings.
          </p>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/plays"
            className="text-sm text-muted hover:text-accent transition-colors"
          >
            View public plays →
          </a>
        </div>
      </div>
    </div>
  );
}
