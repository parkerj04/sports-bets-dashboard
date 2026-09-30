-- Run this in Supabase → SQL Editor → New query → Run
-- Makes picks + profiles readable only after login.

drop policy if exists "Public picks are viewable by everyone" on public.picks;
drop policy if exists "Authenticated can view public picks" on public.picks;

create policy "Authenticated can view public picks"
  on public.picks
  for select
  using (auth.uid() is not null and is_public = true);

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Authenticated can view profiles" on public.profiles;

create policy "Authenticated can view profiles"
  on public.profiles
  for select
  using (auth.uid() is not null);
