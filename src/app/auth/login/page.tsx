"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

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
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setLoading(false);
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      router.push("/auth/mfa");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4"><Logo size={56} /></div>
          <h1 className="text-2xl font-bold tracking-tight">The Locksmith</h1>
          <p className="text-muted mt-1 text-sm">Sign in to unlock the card</p>
        </div>
        <form onSubmit={handleLogin} className="card p-6 space-y-4 shadow-xl shadow-black/40">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm text-muted">Password</label>
              <Link href="/auth/forgot" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
          </div>
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm disabled:opacity-60">
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-6">
          No key yet? <Link href="/auth/signup" className="text-accent hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
