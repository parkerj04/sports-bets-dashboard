"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-muted mt-1 text-sm">See picks, research & best plays of the day</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4 shadow-xl shadow-black/40">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          No account? <Link href="/auth/signup" className="text-accent hover:underline">Create one</Link>
        </p>
        <p className="text-center text-xs text-muted mt-3">
          <Link href="/research" className="hover:text-accent">Browse research</Link>
          {" · "}
          <Link href="/picks" className="hover:text-accent">Public picks</Link>
        </p>
      </div>
    </div>
  );
}
