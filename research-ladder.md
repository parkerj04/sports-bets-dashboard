# Research ladder

Gatherers post. They do not publish. A card hits the game only after it is checked.

## Levels

1. Gather. One agent, one job. Injuries and roster. Coverage and scheme. Last 5 and last meeting. Price, if a feed has it. Post the numbers, not a pick.
2. Card. A second agent writes one bet from those numbers. Case against in the same card. Cap at 64 if a flag exists. No 80.
3. Check. The top pass confirms the roster, the number, and the case against. It cuts a duplicate, a parlay leg posted as its own bet, and a thin leg. Then it marks the card published.

## Table

alter table agent_plays add column if not exists status text default 'intake';

A gatherer posts with status intake. The game page reads status published only.
