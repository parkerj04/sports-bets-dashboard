"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadSlip, saveSlip, slipText, type SlipItem } from "@/lib/slip";

export function SlipTray() {
  const [items, setItems] = useState<SlipItem[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setItems(loadSlip());
    const on = () => setItems(loadSlip());
    window.addEventListener("locksmith-slip", on);
    return () => window.removeEventListener("locksmith-slip", on);
  }, []);

  function clear() {
    saveSlip([]);
    setItems([]);
    window.dispatchEvent(new Event("locksmith-slip"));
  }

  async function copy() {
    const text = slipText(items);
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied list. Paste into Gamblybot.");
    } catch {
      setMsg(text);
    }
  }

  async function saveAccount() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Sign in to store these on your dashboard.");
      return;
    }
    const rows = items.map((x) => ({
      user_id: user.id,
      sport: x.sport === "CFB" ? "NCAAF" : x.sport,
      event: x.game,
      selection: x.pick,
      odds: -110,
      stake: 1,
      notes: x.market,
      research: x.why,
      status: "pending",
      is_public: false,
    }));
    const { error } = await supabase.from("picks").insert(rows);
    setMsg(error ? error.message : `Stored ${rows.length} on your dashboard (private).`);
  }

  if (!items.length) return null;
  const weak = items.filter((x) => !x.playable).length;
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 border-t border-card-border bg-background/95 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setOpen(!open)} className="text-sm font-semibold">
            Slip · {items.length} selected{weak ? ` · ${weak} research-only` : ""}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="btn-primary text-xs px-3 py-1.5">Copy list</button>
            <button type="button" onClick={saveAccount} className="text-xs px-3 py-1.5 rounded-md border border-card-border">Save</button>
            <button type="button" onClick={clear} className="text-xs px-3 py-1.5 rounded-md border border-danger/40 text-danger">Clear</button>
          </div>
        </div>
        {weak > 0 && <p className="text-[11px] text-danger">A checked card under 64 or with flags is research-only. Do not send those to Gamblybot as if they were plays.</p>}
        {msg && <p className="text-[11px] text-muted whitespace-pre-wrap">{msg}</p>}
        {open && (
          <ol className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {items.map((x) => (
              <li key={x.id}>
                <span className={x.playable ? "text-good" : "text-danger"}>{x.pick}</span>
                <span className="text-muted"> · {x.game}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export function SlipCheck({ item }: { item: SlipItem }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(loadSlip().some((x) => x.id === item.id));
    const sync = () => setOn(loadSlip().some((x) => x.id === item.id));
    window.addEventListener("locksmith-slip", sync);
    return () => window.removeEventListener("locksmith-slip", sync);
  }, [item.id]);
  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const cur = loadSlip();
    const next = on ? cur.filter((x) => x.id !== item.id) : [...cur, item];
    saveSlip(next);
    setOn(!on);
    window.dispatchEvent(new Event("locksmith-slip"));
  }
  return (
    <button type="button" onClick={toggle} className={`text-[11px] px-2 py-1 rounded-md border ${on ? "border-good text-good bg-good/10" : "border-card-border text-muted"}`}>
      {on ? "On slip" : "Add to slip"}
    </button>
  );
}
