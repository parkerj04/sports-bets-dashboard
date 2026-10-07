import Link from "next/link";
import { BrandMark } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { profitIfWon, type Bet } from "@/lib/types";

const POSTED = [
  {
    sport: "NCAAF",
    result: "Won",
    title: "3-leg parlay",
    detail: "3u at +421, boosted to +631. Payout $219.39.",
    legs: [
      "Northwestern +3.5 won, 34-13",
      "Liberty -6.5 won, 30-14",
      "Pittsburgh +3.5 won, 35-33",
    ],
  },
  {
    sport: "NCAAF",
    result: "Won",
    title: "3-leg parlay, bonus bet",
    detail: "2u bonus at +518. Payout $103.76.",
    legs: [
      "Northwestern moneyline won, 34-13",
      "Pittsburgh moneyline won, 35-33",
      "Liberty moneyline won, 30-14",
    ],
  },
];

async function settledBook() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("picks")
      .select("sport,event,selection,odds,stake,status")
      .eq("is_public", true)
      .in("status", ["won", "lost", "push"])
      .order("placed_at", { ascending: false })
      .limit(8);
    if (error || !data?.length) return null;
    const rows = data as Pick<Bet, "sport" | "event" | "selection" | "odds" | "stake" | "status">[];
    const wins = rows.filter((row) => row.status === "won").length;
    const losses = rows.filter((row) => row.status === "lost").length;
    let units = 0;
    let staked = 0;
    for (const row of rows) {
      staked += row.stake;
      if (row.status === "won") units += profitIfWon(row.stake, row.odds);
      else if (row.status === "lost") units -= row.stake;
    }
    const roi = staked > 0 ? (units / staked) * 100 : null;
    return { rows, wins, losses, units, roi };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const book = await settledBook();
  const units = book ? `${book.units >= 0 ? "+" : ""}${book.units.toFixed(2)}` : "+18.93u";
  const record = book ? `${book.wins}-${book.losses}` : "2-0";
  const roi = book?.roi == null ? "$103.76" : `${book.roi >= 0 ? "+" : ""}${book.roi.toFixed(1)}%`;
  const unitLabel = book ? "Units" : "Cash";
  const roiLabel = book ? "ROI" : "Bonus";

  return (
    <div className="min-h-screen bg-grid">
      <header className="door border-b border-card-border/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <BrandMark />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/auth/login" className="text-muted hover:text-foreground">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary px-4 py-2 text-xs">Request a key</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">The Locksmith</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Research first. The number is on the card.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          MLB and NFL, with the slate, the props, and the sims behind the key. Settled tickets stay here. Live plays do not.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className="btn-primary px-6 py-3 text-sm">Request a key</Link>
          <Link href="/auth/login" className="rounded-full border border-card-border px-6 py-3 text-sm text-muted hover:text-foreground">
            I already have a key
          </Link>
        </div>

        <section className="mt-12 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="card px-3 py-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted sm:text-xs">Record</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{record}</div>
          </div>
          <div className="card px-3 py-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted sm:text-xs">{unitLabel}</div>
            <div className="mt-1 font-mono text-2xl font-semibold text-accent">{units}</div>
          </div>
          <div className="card px-3 py-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted sm:text-xs">{roiLabel}</div>
            <div className="mt-1 font-mono text-2xl font-semibold">{roi}</div>
          </div>
        </section>
        <p className="mt-3 text-xs text-muted">
          {book
            ? "Settled public picks only. Pending plays are not on this page."
            : "The 3u ticket returned 18.93 units at +631. The bonus ticket paid $103.76. That is not a lifetime ROI."}
        </p>

        <section className="mt-10 grid gap-3 lg:grid-cols-2">
          {book
            ? book.rows.slice(0, 4).map((row) => (
                <article key={`${row.event}-${row.selection}`} className="card p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-muted">{row.sport}</span>
                    <span className={row.status === "won" ? "status-won rounded-full px-2 py-0.5" : "status-lost rounded-full px-2 py-0.5"}>{row.status}</span>
                  </div>
                  <h2 className="mt-3 font-semibold">{row.event}</h2>
                  <p className="mt-1 text-sm text-accent">{row.selection}</p>
                  <p className="mt-2 font-mono text-xs text-muted">{row.stake}u · {row.odds > 0 ? `+${row.odds}` : row.odds}</p>
                </article>
              ))
            : POSTED.map((ticket) => (
                <article key={ticket.title} className="card p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-muted">{ticket.sport}</span>
                    <span className="status-won rounded-full px-2 py-0.5">{ticket.result}</span>
                  </div>
                  <h2 className="mt-3 font-semibold">{ticket.title}</h2>
                  <p className="mt-1 text-sm text-muted">{ticket.detail}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {ticket.legs.map((leg) => <li key={leg}>{leg}</li>)}
                  </ul>
                </article>
              ))}
        </section>

        <section className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            ["Slate", "Time, price, and a short model line. The writeup is inside the game."],
            ["Props", "A photo, the log, and a per-game number. The line is labeled as research, not a book price."],
            ["Sims", "One hundred draws from the posted spread and total. It says what it does not know."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-card-border px-4 py-4">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{copy}</p>
            </div>
          ))}
        </section>

        <div className="mt-8">
          <Link href="/auth/signup" className="btn-primary inline-block px-6 py-3 text-sm">Request a key</Link>
        </div>

        <p className="mt-12 text-xs text-muted">
          21+ only. Gambling is not a paycheck. If it stops being fun, call 1-800-GAMBLER.
        </p>
      </main>
    </div>
  );
}
