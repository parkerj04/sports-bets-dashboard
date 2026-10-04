import Link from "next/link";
import { BrandMark } from "@/components/Logo";

const ROWS = [
  {
    game: "Patriots at Bills",
    mine: "Buffalo -6.5. Do not lay -7.5. Score 56.",
    agent: "James Cook anytime touchdown, score 70, intake.",
    call: "Split",
    why: "The side and the touchdown are not the same bet. Bills 3-0 against Patriots 1-2 is the side, and Highmark had no rain at the last check. Cook has the carries, and Christian Barmore is out, so the role is real. The agent price is around the mid -100s. A short touchdown number does not make the cut. The side makes it at -6.5 only.",
  },
  {
    game: "Lions at Panthers",
    mine: "Carolina +3.5. Score 52.",
    agent: "Lions moneyline, score 71, and Lions -3.5, score 70.",
    call: "Split",
    why: "Two agents took Detroit. One wants the moneyline because of rain. One wants -3.5 off Carolina's corners and Detroit's pressure. My last weather check was cloudy, 65 degrees, wind 2, no precip. If the noon forecast is a downpour, the moneyline is the cleaner Detroit card and my +3.5 is the pass. Laying -3.5 does not make the cut. A field goal on the road at night is the Penn State shape. Post both and decipher the weather before kickoff.",
  },
  {
    game: "Packers at Buccaneers",
    mine: "No card.",
    agent: "Packers moneyline, target -165 or better, score 72.",
    call: "Cut",
    why: "Baker Mayfield is out and Jalon Daniels is the first start. That is a real hole. It is not a 72. Green Bay is 1-2 and has scored 18.7 a game, and the agent already flagged interior line injuries. One model still has Tampa live. A quarterback absence is a modifier, not the bet. Do not chase past -165. It does not make the cut at 72.",
  },
  {
    game: "Chiefs at Raiders",
    mine: "Raiders +4.5. Both teams are 3-0. Score 53.",
    agent: "No card in the intake.",
    call: "Keep",
    why: "No agent card to beat. Laying a short number against another unbeaten is the mistake from Saturday. Allegiant is a dome, so weather is not the flag. The dog makes the cut. The Chiefs do not.",
  },
  {
    game: "Dolphins at Vikings",
    mine: "Under 38.5. Dome. Score 54.",
    agent: "No card in the intake.",
    call: "Keep",
    why: "No agent card. The total is already low, and the roof means weather is not the reason. It makes the cut only at 38.5. A lower number is a pass.",
  },
  {
    game: "Titans at Ravens",
    mine: "Tennessee +11.5. Score 54.",
    agent: "No card in the intake.",
    call: "Keep",
    why: "No agent card. Baltimore -11.5 is too many points. Light rain is about 15 percent, not a downpour. The dog makes the cut. Laying 11.5 does not.",
  },
  {
    game: "Cardinals at Giants",
    mine: "No card.",
    agent: "Trey McBride anytime touchdown +160, score 70.",
    call: "On the edge",
    why: "The agent says 8 red-zone targets, more than the other Cardinals receivers combined, and a score in 4 of the last 7. I have not confirmed that target count from the box scores. The price is plus money, so it does not die on juice. It stays up for you to decipher. It is not a desk keep until the red-zone number is checked.",
  },
  {
    game: "Notre Dame at North Carolina",
    mine: "No card. Weather was not checked.",
    agent: "Notre Dame -21.5, score 74, lost 37-26.",
    call: "Cut",
    why: "Notre Dame won by 11. The number never had a cover path, and the rain was not in the note. A blowout of Purdue is not a 21-point road cover. That reason is dead. Large road favorites do not make the cut without opponent-adjusted points and a forecast.",
  },
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
        <p className="text-sm text-muted">My card against the agent card. A keep is on the game. A cut is not. A split stays so you can decipher it. Nothing here is a placed bet.</p>
        {ROWS.map((r) => (
          <article key={r.game} className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <h2 className="font-semibold">{r.game}</h2>
              <span className="font-mono text-accent">{r.call}</span>
            </div>
            <p><span className="text-muted">Mine. </span>{r.mine}</p>
            <p><span className="text-muted">Agent. </span>{r.agent}</p>
            <p className="leading-6">{r.why}</p>
          </article>
        ))}
      </main>
    </div>
  );
}
