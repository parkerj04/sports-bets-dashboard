import Link from "next/link";

export default function PlaybookPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          <Link href="/research" className="text-sm font-semibold">← Research</Link>
          <Link href="/picks" className="text-sm text-muted">Picks</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-4 py-8 space-y-8 text-sm leading-relaxed">
        <div>
          <h1 className="text-2xl font-bold">Locksmith playbook</h1>
          <p className="text-muted mt-2">
            Free-data reference for props and sides. Nothing here is a guarantee. Books limit winners. Edge is small, variance is not.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">How to weigh evidence</h2>
          <p>Stable rates (K%, usage, target share, on-ice TOI) beat box-score counting stats. Last-5 is a <em>modifier</em>, not a model. Samples under ~20 PA / ~8 targets / ~6 shots are noise. Label folklore as folklore.</p>
          <p>Convert a price to implied probability: American minus money <code className="font-mono">x / (x+100)</code>. Plus money <code className="font-mono">100 / (x+100)</code>. If your number is higher than the implied after juice, that is the only definition of edge that matters.</p>
          <p>Closing line value (did you beat the number the market ended at) is the cleanest live audit. A week of winners with bad CLV is usually luck.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">MLB — highest-signal free numbers</h2>
          <p><strong>Pitcher Ks.</strong> Look at K/9 or K% (FanGraphs / Baseball Savant / MLB.com) and the opposing lineup K% vs that hand. Favorable: starter 9.5+ K/9 into a 25%+ K club. Unfavorable: 7 K/9 into a 18% contact club. Logic: K rate is one of the stickiest skills; books sometimes lag a lineup’s recent punchout spike.</p>
          <p><strong>Hits / total bases.</strong> Opponent WHIP + HR/9, park, and BvP only if PA ≥ ~20. L5 hits is a heat check, not a projection. Barrel% / hard-hit on Savant beats AVG for extra-base props.</p>
          <p><strong>HR yes.</strong> Pitcher HR/9 + hitter barrel% + park factor (ESPN park factors, Baseball-Reference). Wind out at Wrigley is real; treat indoor parks as stable.</p>
          <p><strong>Team total / game total.</strong> Two starter ERAs + both K% + weather. Two punchout arms + 7.0 number is the classic under. Two 4.50 ERAs in Coors is the classic over.</p>
          <p><strong>Free sources:</strong> statsapi.mlb.com (what this site uses), Baseball Savant, FanGraphs (free tables), MLB.com stats, ESPN scoreboard odds, Baseball-Reference game logs, National Weather Service / Open-Meteo.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">NFL</h2>
          <p><strong>Receiving props (yards / catches / TD).</strong> Target share and routes from Pro Football Reference and NFL.com next-gen pages when public; snap % from team depth / ESPN. Favorable: 25%+ target share vs a bottom-10 pass defense in a projected shootout (high team total). Unfavorable: 12% share in a run-script under.</p>
          <p><strong>Rushing.</strong> Inside-zone vs light boxes is folklore unless you have snap/box data. Free proxy: opponent rush yards allowed + game script (if the team is a home favorite, RB overs get a bump — heuristic, medium confidence).</p>
          <p><strong>Passing yards / TDs.</strong> Opponent pass rate allowed, weather (NWS), OL injuries (NFL.com / ESPN injury report). Wind + rain shorts passing unders more than TV narratives admit.</p>
          <p><strong>Anytime TD.</strong> Red-zone touches are the number. PFR play finder / team snap counts. High RZ share + short favorite is the only TD over that is not a lottery ticket.</p>
          <p><strong>Free sources:</strong> ESPN scoreboard (lines, records), NFL.com injuries, PFR, Pro-Football-Reference snap counts, Next Gen Stats public leaderboards, NWS, team depth charts on ESPN.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">NBA</h2>
          <p><strong>Points / PRA.</strong> Usage + minutes. A 32-minute 28% usage wing vs a 36-minute 32% usage night is a different player. Favorable: usage up because a teammate is out (injury report). Books are slower on confirmed scratches than on stars.</p>
          <p><strong>Rebounds / assists.</strong> Opponent pace (Basketball-Reference) and defensive rebound rate. Blowout risk kills minutes — fade overs when the spread is huge.</p>
          <p><strong>Threes.</strong> Attempt rate more than make %. A 9-attempt shooter in a high-pace game is the over even if he is “cold.”</p>
          <p><strong>Free sources:</strong> Basketball-Reference, NBA.com stats (free), ESPN injuries, Cleaning the Glass is paid so skip it, official injury report on NBA.com.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">NHL</h2>
          <p><strong>Points / shots.</strong> Power-play unit and TOI. A PP1 winger at 20 minutes vs a sheltered 12-minute winger. Ice time is the prop.</p>
          <p><strong>Goalie saves / wins.</strong> Starter confirmation (DailyFaceoff / ESPN) + opponent shot volume. Back-to-backs and travel matter more than “hot goalie” narratives (folklore unless save% sample is huge).</p>
          <p><strong>Free sources:</strong> NHL.com, Natural Stat Trick (free advanced), MoneyPuck public charts, DailyFaceoff lines, ESPN scoreboard.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Soccer</h2>
          <p><strong>Shots / shots on target / goals.</strong> xG and shot volume from FBref / Understat (free). A striker at 0.55 xG/90 vs a bottom-third defense is the over; last-5 with 0 goals and 4 xG is still an over if the line is 0.5.</p>
          <p><strong>Team totals.</strong> Pace of both sides + travel + weather is weaker than xG difference over 8+ matches.</p>
          <p><strong>Free sources:</strong> FBref, Understat, FPL official (EPL minutes), club injury pages, Sofascore public, ESPN.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Books, juice, shopping</h2>
          <p>Openers are softer than closes. Props are softer than sides. Alt lines hide juice. Shop the same market across legal books you can actually use — one extra cent of probability compounds. Screenshots of “best odds” sites are ads; the number in your account is the number.</p>
          <p>This desk does not shop 18 books. ESPN/DK lines on the slate are a reference, not the best price.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bankroll (short)</h2>
          <p>1 unit = 1% of bankroll is a working default. Props have fatter tails than −110 sides. A 3% edge still loses months. If you cannot tolerate a 20-unit drawdown, the unit is too big.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">What this site already pulls for you</h2>
          <p>MLB schedule, arsenals, zones, L5 pitcher starts, L/R splits, BvP, projected Ks, LS rating, ESPN lines, NFL week board. The playbook above is how to read those numbers — it does not replace them.</p>
        </section>
      </article>
    </div>
  );
}
