# Edge Desk — Sports Picks & Research Dashboard

Real accounts, public picks feed, and an MLB research board that scores today’s strikeout edges from live data.

## Features

- **Sign up / Sign in** (Supabase Auth)
- **Dashboard** — post picks with research notes, track results & units
- **Public /picks** — friends see your shared plays + reasoning
- **Research desk** — auto-scores MLB matchups (pitcher K/9 vs team K%) for best plays of the day
- Free MLB Stats API (no key)

## Setup (5 minutes)

### 1. Create a free Supabase project

1. Go to [database.new](https://database.new) and create a project
2. Project Settings → API → copy **Project URL** and **anon public** key

### 2. Run the database schema

In Supabase → **SQL Editor** → paste and run the contents of `supabase-schema.sql`

### 3. Configure the app

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_OWNER_EMAIL=your@email.com
```

### 4. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Auth settings (optional but recommended)

In Supabase → Authentication → Providers:
- Enable Email
- For local testing you can disable “Confirm email” under Auth → Providers → Email

## Deploy on Vercel

1. Push this repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add the same three env vars
4. Deploy — share the live URL with friends

## How research works

The `/research` page and `/api/research` route:

1. Pull today’s MLB schedule + probable pitchers from `statsapi.mlb.com`
2. Fetch each pitcher’s season K/9 and the opposing team’s strikeout rate
3. Score the matchup (higher = better strikeout environment)
4. Surface the strongest edges with full reasoning and stats

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase (Auth + Postgres + RLS)
- MLB Stats API (free, no key)
