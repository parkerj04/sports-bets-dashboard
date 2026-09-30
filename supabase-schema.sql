-- Run this in your Supabase SQL Editor

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_owner boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sport text not null,
  event text not null,
  selection text not null,
  odds numeric not null,
  stake numeric not null default 1,
  book text,
  notes text,
  research text,
  status text not null default 'pending'
    check (status in ('pending', 'won', 'lost', 'push', 'void')),
  is_public boolean not null default true,
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists picks_user_id_idx on public.picks(user_id);
create index if not exists picks_public_idx on public.picks(is_public, placed_at desc);

alter table public.picks enable row level security;
alter table public.profiles enable row level security;

create policy "Public picks are viewable by everyone"
  on public.picks for select using (is_public = true);

create policy "Users can view own picks"
  on public.picks for select using (auth.uid() = user_id);

create policy "Users can insert own picks"
  on public.picks for insert with check (auth.uid() = user_id);

create policy "Users can update own picks"
  on public.picks for update using (auth.uid() = user_id);

create policy "Users can delete own picks"
  on public.picks for delete using (auth.uid() = user_id);

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
