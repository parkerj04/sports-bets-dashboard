import Link from "next/link";
import { BrandMark } from "@/components/Logo";

const COMPARE = [
  { game: "Patriots at Bills", mine: "Buffalo -6.5 only. James Cook is the touchdown name, not the side.", agent: "James Cook anytime, score 70. Price was mid -100s.", call: "Split", why: "The side makes the cut at -6.5. The touchdown does not at a minus price. Josh Allen has 6 rushing scores in 3 games, so he is the case against Cook." },
  { game: "Cardinals at Giants", mine: "Trey McBride and Malik Nabers.", agent: "McBride +160, score 70. The 8 red-zone targets are the agent's number, not mine.", call: "On the edge", why: "Plus money keeps McBride alive. I have not confirmed the red-zone count from the boxes. Nabers was posted +210 at Action. James Conner is on injured reserve, so the Cardinals' receiving work is the path. It stays up to decipher." },
  { game: "Lions at Panthers", mine: "Jahmyr Gibbs and Amon-Ra St. Brown. Side is Carolina +3.5.", agent: "Lions moneyline 71 and Lions -3.5 70. No touchdown card.", call: "Split", why: "The agent took the side. I did not. Gibbs is the back and St. Brown is the target. Neither is a touchdown card without a plus-money price. Laying -3.5 still does not make the cut." },
  { game: "Packers at Buccaneers", mine: "Josh Jacobs. No second name.", agent: "Packers moneyline, score 72. Mayfield is out.", call: "Cut", why: "The moneyline at 72 does not make the cut. Jacobs is the only touchdown role I will name. Jalon Daniels making a first start is not a score bet." },
];

const TD = [
  { game: "Cardinals at Giants", a: "Trey McBride", b: "Malik Nabers", why: "McBride is the agent card at +160. Nabers was +210 at Action. Conner is on injured reserve. The hole is I have not confirmed McBride's red-zone count." },
  { game: "Patriots at Bills", a: "James Cook", b: "Josh Allen", why: "Cook is the carry back and Barmore is out. Allen has 6 rushing scores in 3 games, so he is both the other name and the case against Cook. Cook's price was minus. Allen is the plus-money name if it is still plus." },
  { game: "Cowboys at Texans", a: "CeeDee Lamb", b: "No second name", why: "Lamb is the Dallas target. I do not have a confirmed Houston scorer or a price. A name without a price does not make the cut." },
  { game: "Packers at Buccaneers", a: "Josh Jacobs", b: "No second name", why: "Mayfield is out. Daniels is a first start, not a score. Jacobs is the Green Bay back. No price confirmed." },
  { game: "Jaguars at Bengals", a: "No card", b: "No card", why: "Action posted Joe Burrow +950 and Jakobi Meyers +250. I have not confirmed Burrow is active. No touchdown goes up on an unconfirmed quarterback." },
  { game: "Rams at Eagles", a: "Jalen Hurts", b: "No second name", why: "Hurts is the short-yardage quarterback. Action said the price is too short to be a bet. No Rams name makes the cut without a plus number." },
  { game: "Jets at Bears", a: "No card", b: "No card", why: "No role and no price I can source. A guess does not go on the board." },
  { game: "Titans at Ravens", a: "Derrick Henry", b: "No second name", why: "Henry is the Baltimore back in a game Baltimore is laying 11.5. The side is the dog. The score name is Henry only if the number is plus. It will not be." },
  { game: "Dolphins at Vikings", a: "Justin Jefferson", b: "No second name", why: "Jefferson is the target. The books have already cut this price. The under is the card. The touchdown is not, unless it is plus money." },
  { game: "Broncos at 49ers", a: "No card", b: "No card", why: "No confirmed price and no confirmed red-zone role. Pass." },
  { game: "Chiefs at Raiders", a: "No card", b: "No card", why: "Both teams are 3-0. The card is Raiders +4.5. I will not add a touchdown to force a name onto a short favorite." },
  { game: "Chargers at Seahawks", a: "No card", b: "No card", why: "Seattle is laying 7.5. No plus-money scorer confirmed. Pass." },
  { game: "Lions at Panthers", a: "Jahmyr Gibbs", b: "Amon-Ra St. Brown", why: "Gibbs is the back. St. Brown is the target. The agent took the Lions side, not these scores. Neither is a bet until the price is plus." },
  { game: "Falcons at Saints, Monday", a: "Bijan Robinson", b: "No second name", why: "Bijan is the Atlanta back. Tyler Allgeier showed up on a combined board, which is the case against Bijan getting every score. No price confirmed." },
];

export default function DeskPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard"><BrandMark /></Link>
          <Link href="/research" className="text-sm text-muted hover:text-accent">Slate</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold">Desk review</h1>
        <p className="text-sm text-muted">My card, then the agent card, then the call. Touchdowns are two names a game. A blank second name means I would not invent one. London has already kicked and is not on this list.</p>
        <h2 className="font-semibold">Side and total</h2>
        {COMPARE.map((r) => (
          <article key={r.game} className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><h2 className="font-semibold">{r.game}</h2><span className="font-mono text-accent">{r.call}</span></div>
            <p><span className="text-muted">Mine. </span>{r.mine}</p>
            <p><span className="text-muted">Agent. </span>{r.agent}</p>
            <p className="leading-6">{r.why}</p>
          </article>
        ))}
        <h2 className="font-semibold pt-4">Anytime touchdowns</h2>
        {TD.map((r) => (
          <article key={r.game} className="card p-4 space-y-2 text-sm">
            <h2 className="font-semibold">{r.game}</h2>
            <p className="font-mono">{r.a} · {r.b}</p>
            <p className="leading-6">{r.why}</p>
          </article>
        ))}
      </main>
    </div>
  );
}
