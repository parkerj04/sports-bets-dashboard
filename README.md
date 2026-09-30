# Sports Bets Dashboard

Track your sports bets and share plays with friends.

## Features

- **Login screen** – simple password protection (default: `bets123`)
- **Dashboard** – add bets, mark won/lost/push, track units & ROI
- **Public /plays page** – friends can view the bets you mark as public
- Dark sports-themed UI

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Login with password `bets123` (change it in Settings after logging in)
- Add bets and toggle “Share” so they appear on `/plays`
- Share the `/plays` URL with your friends

## Deploy

Push to GitHub and connect the repo to [Vercel](https://vercel.com) for a free live URL.

## Note on data

Bets are stored in the browser’s `localStorage`. This means:

- Data stays on the device where you logged in
- The public plays page only works for people using the same browser session / after you open the site on that device

For true multi-device / live sharing you can later plug in Supabase, Firebase, or any backend. The UI is already structured for that.

## Stack

- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS v4
