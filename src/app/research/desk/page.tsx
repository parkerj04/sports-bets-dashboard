import Link from "next/link";
import { BrandMark } from "@/components/Logo";

const GAMES = [
  {
    game: "Patriots at Bills",
    mine: "James Cook and Josh Allen",
    agent: "Cook 70. Dalton Kincaid +165, score 65. D.J. Moore +160, score 65.",
    call: "Split",
    why: "Cook is the carry back and Barmore is out. His price was minus, so the touchdown does not make the cut. Allen has 6 rushing scores in 3 games, so he is the second name and the case against Cook. Kincaid and Moore are plus money. Schooler and both starting corners are the agent's hole. Those two stay on the edge. I have not confirmed the corner names from the inactive list.",
  },
  {
    game: "Cardinals at Giants",
    mine: "Trey McBride and Malik Nabers",
    agent: "McBride +160, score 70.",
    call: "On the edge",
    why: "Same first name. Nabers is my second, posted +210 at Action. The agent's 8 red-zone targets are not confirmed by me. Plus money keeps McBride up. It is not a keep until that count is checked.",
  },
  {
    game: "Cowboys at Texans",
    mine: "Nico Collins and Jake Ferguson",
    agent: "Collins +140, score 65. Ferguson +310, score 65.",
    call: "Keep Ferguson. Collins on the edge.",
    why: "I had no second name. The agent did. Ferguson at +310 is the price that makes the cut if the red-zone tie is real. Collins is the Houston target, and the agent says it is his first game back since Week 1. That is a flag, not a kill. The Dallas secondary claim is the agent's, not confirmed here.",
  },
  {
    game: "Packers at Buccaneers",
    mine: "Josh Jacobs and Christian Watson",
    agent: "Bucky Irving +145, score 65. Watson +175, score 65.",
    call: "Split",
    why: "Mayfield is out, so Tampa leaning on Irving is a real path. Watson at +175 is the Green Bay pass name. Jacobs is my back. The Packers moneyline at 72 still does not make the cut. The two plus-money scores stay.",
  },
  {
    game: "Rams at Eagles",
    mine: "Saquon Barkley and Davante Adams",
    agent: "Adams +115, score 65. Barkley +110, score 65.",
    call: "On the edge",
    why: "Same two names. The agent says Mitchell shadows Nacua, so Adams is the second corner. I have not confirmed that shadow. Barkley at +110 is short for a back who gets the goal line. The A.J. Brown traded line in the agent note is not confirmed. Do not use it.",
  },
  {
    game: "Jets at Bears",
    mine: "Garrett Wilson and Braelon Allen",
    agent: "Wilson +150, score 50. Allen +115, score 50.",
    call: "Keep Wilson. Allen on the edge.",
    why: "I had no card. The agent filled both. Wilson at +150 is the receiver if the room is down to him. Allen only makes it if Breece Hall is out. That inactive has to be confirmed before it is a bet.",
  },
  {
    game: "Titans at Ravens",
    mine: "Derrick Henry and Lamar Jackson",
    agent: "Lamar rushing score +240, score 65. Henry first-half +120, score 65.",
    call: "Keep Lamar. Henry on the edge.",
    why: "Henry is the back. Lamar at +240 is the second scorer and the better price. The agent says 5 of Henry's 6 scores were in the first half. I have not confirmed that split. The side is still Tennessee +11.5, not a Henry ticket at a short number.",
  },
  {
    game: "Dolphins at Vikings",
    mine: "Jordan Addison and Aaron Jones",
    agent: "Jones -140, score 65. Addison +135, score 65. Agent says Jefferson and Achane are out.",
    call: "Keep Addison. Cut Jones on price.",
    why: "If Jefferson is out, my earlier Jefferson name is dead. Addison at +135 is the pass name. Jones at -140 does not make the cut. Confirm Jefferson and Achane are inactive before either is a bet.",
  },
  {
    game: "Jaguars at Bengals",
    mine: "Ja'Marr Chase and Parker Washington",
    agent: "Chase -105, score 50. Washington +150, score 50.",
    call: "Keep Washington. Cut Chase on price.",
    why: "Chase is the name and the price is minus. Washington at +150 is the second scorer. Burrow was not confirmed earlier, so this is a receiver card, not a quarterback card.",
  },
  {
    game: "Broncos at 49ers",
    mine: "J.K. Dobbins and Christian McCaffrey",
    agent: "Dobbins +120 to +125, score 65. McCaffrey -165, score 50.",
    call: "Keep Dobbins. Cut McCaffrey on price.",
    why: "Dobbins is the plus-money back. McCaffrey is the name and the price is too short. Bosa out is the agent's flag, not confirmed here.",
  },
  {
    game: "Chiefs at Raiders",
    mine: "Ashton Jeanty and no Chiefs score",
    agent: "Jeanty, score 50, price -120 to -175. Kenneth Walker III, score 50, filed on this game.",
    call: "Cut both.",
    why: "Jeanty is the Raiders back and the price is minus. Walker is a Seahawks back filed on a Chiefs game. Wrong team. That card does not make the cut. The side remains Raiders +4.5.",
  },
  {
    game: "Chargers at Seahawks",
    mine: "No confirmed second name",
    agent: "Emanuel Wilson +110, score 50, filed on this game.",
    call: "Cut",
    why: "Emanuel Wilson is a Packers back. He is filed on the Seattle game. Wrong team. I will not invent a Seattle or Chargers scorer to fill the slot.",
  },
  {
    game: "Lions at Panthers",
    mine: "Jahmyr Gibbs and Amon-Ra St. Brown",
    agent: "Chuba Hubbard -140, score 65. Gibbs -325, score 50.",
    call: "Cut both agent prices. St. Brown is the second name.",
    why: "Gibbs at -325 is not a bet. Hubbard at -140 is not a bet. St. Brown is the pass name. Neither agent card makes the cut on price. The side split with Carolina +3.5 still stands.",
  },
  {
    game: "Falcons at Saints, Monday",
    mine: "Bijan Robinson and Tyler Allgeier",
    agent: "No card.",
    call: "On the edge",
    why: "Bijan is the back. Allgeier is the second scorer because he showed up on the combined board, which is the case against Bijan getting every score. No price confirmed. No agent card to beat.",
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
        <p className="text-sm text-muted">My two scorers, then every agent scorer. 25 agent touchdown cards were in the intake. A cut is price or a wrong team. A keep is plus money with a role. Nothing here is a placed bet. London already kicked and is off.</p>
        {GAMES.map((r) => (
          <article key={r.game} className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><h2 className="font-semibold">{r.game}</h2><span className="font-mono text-accent">{r.call}</span></div>
            <p><span className="text-muted">Mine. </span>{r.mine}</p>
            <p><span className="text-muted">Agent. </span>{r.agent}</p>
            <p className="leading-6">{r.why}</p>
          </article>
        ))}
      </main>
    </div>
  );
}
