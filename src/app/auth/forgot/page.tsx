"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/update-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Check your email for a reset link. It expires quickly.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4"><Logo size={56} /></div>
          <h1 className="text-2xl font-bold">Forgot password</h1>
          <p className="text-muted text-sm mt-1">We’ll email you a reset link</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          {message && <p className="text-sm text-accent bg-accent/10 rounded-lg px-3 py-2">{message}</p>}
          <button className="btn-primary w-full py-2.5 text-sm" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-6">
          <Link href="/auth/login" className="text-accent hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
