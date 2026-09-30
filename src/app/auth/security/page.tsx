"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function SecurityPage() {
  const [qr, setQr] = useState("");
  const [factorId, setFactorId] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) setEnabled(true);
    });
  }, []);

  async function startEnroll() {
    setError("");
    setStatus("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Locksmith",
    });
    if (error) {
      setError(error.message + " — turn on TOTP in Supabase Auth → Multi-Factor.");
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function confirm() {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !challenge) {
      setLoading(false);
      setError(cErr?.message || "Challenge failed");
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
    setEnabled(true);
    setStatus("2FA is on. Next sign-in will ask for an app code.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4"><Logo size={56} /></div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-muted text-sm mt-1">Authenticator 2FA</p>
        </div>
        <div className="card p-6 space-y-4">
          {enabled && <p className="text-sm text-accent">Authenticator is enabled on this account.</p>}
          {!enabled && !qr && (
            <button className="btn-primary w-full py-2.5 text-sm" onClick={startEnroll}>
              Set up authenticator
            </button>
          )}
          {qr && !enabled && (
            <>
              <p className="text-sm text-muted">Scan this with Google Authenticator, Authy, or 1Password.</p>
              {/* qr_code from supabase is an svg data url */}
              <img src={qr} alt="2FA QR code" className="mx-auto bg-white rounded-lg p-2 w-48 h-48" />
              <p className="text-[11px] text-muted break-all">Or enter secret: {secret}</p>
              <input className="input text-center tracking-[0.3em]" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="btn-primary w-full py-2.5 text-sm" onClick={confirm} disabled={loading}>
                {loading ? "Verifying…" : "Confirm and enable"}
              </button>
            </>
          )}
          {error && <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
          {status && <p className="text-sm text-accent bg-accent/10 rounded-lg px-3 py-2">{status}</p>}
        </div>
        <p className="text-center text-sm text-muted mt-6">
          <Link href="/dashboard" className="text-accent hover:underline">Back to desk</Link>
        </p>
      </div>
    </div>
  );
}
