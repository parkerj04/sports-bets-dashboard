import Link from "next/link";

export default function NflPlaybookPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-card-border sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between">
          <Link href="/research" className="text-sm font-semibold">← NFL board</Link>
          <Link href="/research/playbook" className="text-sm text-muted">MLB playbook</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-4 py-8 space-y-10 text-sm leading-relaxed">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted">The Locksmith · NFL desk</p>
          <h1 className="text-2xl font-bold">Pre-bet checklist</h1>
          <p className="text-muted">
            Walk this in order for every card. Front-load stable work Monday–Wednesday. Recheck last-minute items Friday night and again 90 minutes before kickoff. Nothing here prints money. Books limit winners. Edge is small.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">How to spend the week</h2>
          <p><strong>Stable (do early, rarely redo):</strong> season DVOA / EPA, scheme, OL vs front, coverage family vs route tree, rest/travel already on the calendar, coaching 4th-down and 2-minute rates, home/away splits that have a full season sample.</p>
          <p><strong>Last-minute (must refresh):</strong> injury report designations, inactive list, starting OL, weather in the last 3 hours, line + total movement vs open, public tickets vs handle if you can see it, QB/WR/RB snap confirmation.</p>
          <p>If only the weather and a backup RT change, your early EPA work still stands. If the QB or two starting OL flip to OUT, rebuild the total and the opposing pass-rush props from scratch.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Weight by bet type</h2>
          <p><strong>Spread:</strong> net EPA or DVOA gap, offensive line vs pass rush, explosive-play rate allowed, rest (TNF / short week), home field in the 2.0–2.5 range — not 3.5 unless weather + crowd actually matter. Situational spots (look-ahead, letdown) are overrated unless the talent gap is tiny.</p>
          <p><strong>Total:</strong> combined pace + success rate, OL health, wind 15+ mph or real rain/snow, both defenses’ explosive rate, QB availability. Indoor + two top-10 offenses = default over unless the number is already juiced. Outdoor + 20 mph + two mediocre QBs = default under.</p>
          <p><strong>ML:</strong> same as spread plus price. A −14 dog at +480 can be the bet when the spread is fair. A −1 favorite at −130 is often the worst number on the board.</p>
          <p><strong>Props:</strong> role (routes, carry share, RZ touches) beats box-score average. Opponent coverage family and box count beat “he’s due.” Minutes of news (OUT teammate) beat last-5 slumps.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Team quality — highest weight</h2>
          <p>Use <em>efficiency</em>, not yards. Yards per game is a pace + garbage-time trap.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Offensive / defensive EPA per play or DVOA — Football Outsiders / FTN DVOA (free weekly tables when posted), Pro Football Reference EPA via sports-ref game pages, NFL Next Gen public leaderboards.</li>
            <li>Success rate on early downs. A team that is 1st-and-10 efficient does not need as many explosives.</li>
            <li>Explosive play rate (runs 10+, passes 16+ or 20+). One side that both creates and prevents explosives owns the spread more than “points per game.”</li>
            <li>Turnover EPA, not raw TO margin. Luck-heavy TO margin reverts. Mark it as medium confidence.</li>
          </ul>
          <p>Decision rule: if net DVOA / EPA gap is large and the spread is inside a key number (3, 7, 10) the other way, that is the first place to look. If the gap is tiny, skip the side and hunt a total or a prop.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Unit matchups</h2>
          <p><strong>OL vs front:</strong> pass-block win rate vs pass-rush win rate (Next Gen Stats public). If the rush win rate for the defense is top-8 and the OL just lost a tackle, shade the opposing sack / QB hit props up and the team total down. A 20%+ drop in pass-block win rate week to week after an OL injury is actionable. A 3% blip is noise.</p>
          <p><strong>Coverage vs receivers:</strong> man-heavy defenses punish skinny slot WR3s and help contested-catch X receivers less than TV says. Zone-heavy + a high-option RB is a checkdown-over. Sources: Next Gen coverage splits when public, PFR defensive alignment, film notes from free coaches tape if you watch it — do not pretend you did if you did not.</p>
          <p><strong>Run fit vs back:</strong> light boxes vs a 1,200-yard back is a rushing-over only if game script is not a 10-point dog. Script kills RB overs more than “tough run D.”</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Quarterback and skill usage</h2>
          <p>QB EPA/play and pressure-to-sack are the two QB numbers that survive. Completion % over expected is useful; raw yards are not.</p>
          <p>WR/TE: target share and route participation over the last 4 <em>healthy</em> games, not last 1. A 27% share with the WR1 out is a different player than a 14% share in 11-on-11. Free: PFR snap counts, ESPN stat pages, NFL.com player pages, FantasyPros snap % (free tier).</p>
          <p>RB: carry share + RZ carry share. Anytime TD is a RZ-touch bet. If he has 40% of RZ carries and the team is a home favorite, the TD is live. If he has 18% and they trail, fade it.</p>
          <p>Decision rule: if usage is unchanged and the line moved because of a “cold” narrative, lean with usage. If usage just changed because of an OUT, rebuild the prop the same day.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Injuries and depth — last-minute, high weight</h2>
          <p>Official NFL injury report: Wed / Thu / Fri practice designations, then Friday or Saturday report, then inactives ~90 minutes before kickoff. ESPN and NFL.com carry the same list.</p>
          <p>Weight: QB OUT = rebuild everything. LT / C OUT = rebuild pass game and sacks. WR1 OUT = bump WR2 targets ~4–7% of team targets (heuristic, medium confidence). CB1 OUT = bump opposing X receiver. RB1 OUT = committee chaos; do not auto-fade the backup’s rushing line without looking at the committee split.</p>
          <p>Questionable Friday is not OUT. Wait for inactives on props that die if he sits.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Coaching, script, situation</h2>
          <p>4th-down aggressiveness and two-minute pace are real and stable (PFR play-by-play, team 4th-down pages). “They always run when ahead” is only useful if you have the actual run rate when leading by 8+.</p>
          <p>Rest: TNF after a Sunday road game is a real total-under lean, especially with travel west-to-east. Bye-week magic is overrated after week 6.</p>
          <p>Motivation / look-ahead / revenge: folklore unless it is week 18 with nothing to play for vs a team that needs the division. Label that high confidence. Label “they lost last year and they’re mad” as folklore.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Weather and venue</h2>
          <p>NWS forecast for the stadium city, then a stadium-specific check 3 hours out. Wind 15+ mph is the number that actually moves passing and totals. Cold alone does little until it is brutal and paired with wind. Light rain is overrated. Snow that accumulates is not.</p>
          <p>Dome / retractable closed = ignore weather. Open retractable in a storm = confirm the roof plan; do not assume.</p>
          <p>Altitude (Denver) is a small total bump, not a thesis by itself. Home field is ~2 to 2.5 points in a clean environment. Crowd noise on the road OL’s first start is a sack-over sliver, not a spread thesis.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Market — last-minute</h2>
          <p>Open vs current on ESPN / your book. A number that moves toward 3 or 7 and stalls is different from a number that blows through 3. Steam that you did not understand is not a reason to chase; it is a reason to ask what you missed (injury, weather, or a limit-taker).</p>
          <p>Public tickets on a flashy favorite with the handle on the dog is the only public/sharp split worth a look, and most free sites lie about it. Treat “80% of bets on X” as marketing unless you trust the source. Medium-low confidence.</p>
          <p>CLV: if you regularly beat the close you have a process. If you win but lose the close, you got lucky. Track it in your own sheet. This site does not shop 18 books — ESPN lines on the NFL tab are a reference price, not the best price.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Props — compact rules</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Passing yards: OL health + wind + opponent blitz rate + projected pass attempts (game total and spread script).</li>
            <li>Rushing yards: carry share × expected plays × opponent EPA/rush. Dog script kills it.</li>
            <li>Receptions / yards: routes + target share + coverage family. Last-5 is a modifier only.</li>
            <li>Anytime TD: RZ touch share. Without that number you are guessing.</li>
            <li>Sacks: pass-rush WR vs backup tackle + projected dropbacks. One game sample of zero sacks is noise.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Repeatable walk-through</h2>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Write the net efficiency gap in one sentence.</li>
            <li>Write the two unit matchups that matter (usually OL/front and one coverage/route).</li>
            <li>Mark rest, travel, roof, wind.</li>
            <li>Price a fair spread and total before you look at the board. Then look. If you cannot name a number, you do not have a bet.</li>
            <li>Only then open props. One usage change can make three props and kill two others.</li>
            <li>Friday report. Saturday/Sunday inactives. Weather. Then bet or pass.</li>
            <li>Log the close. Not just the result.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Overrated (do not burn the week here)</h2>
          <p>ATS streaks, “covers in the rain,” revenge, primetime magic, rushing-yards-per-game without script, one-game sack explosions, Twitter injury speculation before the report, and any model that ignores OL health. Those are how recreational money gets harvested.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Bankroll</h2>
          <p>1 unit = 1% of bankroll. Props get a half unit until you have a tracked sample. Never parlay a “lock” to make the juice feel better. A 3% edge still loses months. If a 20-unit hole would change how you live, the unit is too big.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Free sources (no paywall required)</h2>
          <p>ESPN scoreboard and injury report · NFL.com injuries and inactives · Pro-Football-Reference snaps, game logs, 4th downs · Next Gen Stats public leaderboards · FTN / FO DVOA weekly tables when free · NWS / weather.gov · team depth charts on ESPN · this site’s NFL tab for the posted line + a first lean.</p>
        </section>
      </article>
    </div>
  );
}
