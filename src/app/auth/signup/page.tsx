"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split("@")[0] } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user && !data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
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
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-muted mt-1 text-sm">Join to follow picks and research</p>
        </div>

        <form onSubmit={handleSignup} className="card p-6 space-y-4 shadow-xl shadow-black/40">
          <div>
            <label className="block text-sm text-muted mb-1.5">Display name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
          </div>
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          {message && <p className="text-sm text-accent bg-accent/10 rounded-lg px-3 py-2">{message}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm disabled:opacity-60">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account? <Link href="/auth/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
