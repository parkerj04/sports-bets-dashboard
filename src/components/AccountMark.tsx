"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { profitIfWon, type BetStatus } from "@/lib/types";

type Row = { status: BetStatus; stake: number; odds: number };

export function AccountMark({ inline = false }: { inline?: boolean }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [units, setUnits] = useState<number | null>(null);
  const [record, setRecord] = useState("");
  const [empty, setEmpty] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!live) return;
      const user = data.user;
      if (!user) {
        setEmail(null);
        setReady(true);
        return;
      }
      setEmail(user.email || "Signed in");
      const { data: picks } = await supabase.from("picks").select("status,stake,odds").eq("user_id", user.id);
      if (!live) return;
      const rows = (picks || []) as Row[];
      if (!rows.length) {
        setEmpty(true);
        setUnits(0);
        setRecord("");
      } else {
        const wins = rows.filter((r) => r.status === "won").length;
        const losses = rows.filter((r) => r.status === "lost").length;
        let sum = 0;
        for (const row of rows) {
          if (row.status === "won") sum += profitIfWon(row.stake, row.odds);
          else if (row.status === "lost") sum -= row.stake;
        }
        setEmpty(false);
        setUnits(sum);
        setRecord(`${wins}-${losses}`);
      }
      setReady(true);
    }).catch(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    function down(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setUnits(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const unitText = units == null ? "" : `${units >= 0 ? "+" : ""}${units.toFixed(2)}u`;

  return (
    <div ref={box} className={inline ? "relative flex items-center gap-2" : "fixed top-2 right-3 z-50 flex items-center gap-2"}>
      {email && units != null ? (
        <span className={`rounded-xl border border-card-border bg-card px-2.5 py-2 font-mono text-xs ${units < 0 ? "text-danger" : "text-good"}`}>{unitText}</span>
      ) : null}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Account" aria-expanded={open} className="grid size-10 place-items-center rounded-full border border-accent/50 bg-card text-accent">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="card absolute right-0 top-12 z-50 w-64 p-3">
          {!ready ? <p className="text-sm text-muted">Checking the account…</p> : null}
          {ready && !email ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">Sign in to see your units.</p>
              <Link href="/auth/login" className="btn-primary px-3 py-2 text-center text-sm" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className="text-center text-sm text-muted" onClick={() => setOpen(false)}>Create account</Link>
            </div>
          ) : null}
          {ready && email ? (
            <div className="flex flex-col gap-3">
              <p className="truncate text-xs text-muted">{email}</p>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted">Units</div>
                {empty ? <p className="mt-1 text-sm">No picks logged.</p> : <p className={`mt-1 font-mono text-2xl font-semibold ${units != null && units < 0 ? "text-danger" : "text-good"}`}>{units == null ? "" : `${units >= 0 ? "+" : ""}${units.toFixed(2)}`}</p>}
                {record ? <p className="text-sm text-muted">{record}</p> : null}
              </div>
              <Link href="/dashboard" className="text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/auth/security" className="text-sm text-muted" onClick={() => setOpen(false)}>Security</Link>
              <button type="button" onClick={signOut} className="text-left text-sm text-danger">Sign out</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AccountSlot() {
  const path = usePathname();
  if (path === "/" || path === "/research" || path.startsWith("/auth")) return null;
  return <AccountMark />;
}