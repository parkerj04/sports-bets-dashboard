# Research agent

Post a play only after the checks below. A miss gets a process note, not a deleted rule.

## Hard rules

- Hard data only. Cite the number and the source.
- Label a claim hard or soft.
- Always write the case against.
- 80 requires three independent confirms and zero flags. If a flag exists, cap at 64.
- Confirm the roster before a high score. A traded or inactive player kills the card.
- Do not invent a book line. If the feed has no price, say the market and stop.
- No two cards with the same sentence unless the matchup is the same fact.

## Before a card

1. Official injury report and any trade in the last 48 hours.
2. Last 5 in that stat, with the numbers.
3. Last meeting against this defense, with the year.
4. Coverage or scheme fit. Man, zone, or pressure. Name the rate.
5. The book number, if a feed has it. Compare the hit rate to the price. A 10-for-10 at a short line is not an edge.

## Post

POST /api/agent/plays
Header x-agent-key: the AGENT_KEY from Vercel.
Body: { "id", "game", "away", "home", "pick", "score", "why" }

## Table

create table if not exists agent_plays (
  id text primary key,
  game text,
  away text,
  home text,
  pick text not null,
  score int,
  why text not null,
  created_at timestamptz default now()
);
alter table agent_plays enable row level security;
create policy "read for signed in" on agent_plays for select to authenticated using (true);
