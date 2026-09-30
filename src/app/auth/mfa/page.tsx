"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function MfaVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) setError(error.message);
      const totp = data?.totp?.[0];
      if (totp) setFactorId(totp.id);
      else setError("No authenticator is set up on this account.");
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setLoading(false);
      setError(cErr?.message || "Could not start 2FA check");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setLoading(false);
    if (vErr) {
      setError(vErr.message);
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
          <h1 className="text-2xl font-bold">Two-factor code</h1>
          <p className="text-muted text-sm mt-1">Open your authenticator app</p>
        </div>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <input className="input text-center tracking-[0.4em] text-lg" inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} required />
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          <button className="btn-primary w-full py-2.5 text-sm" disabled={loading || !factorId}>
            {loading ? "Checking…" : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
