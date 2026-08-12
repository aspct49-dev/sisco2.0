# SISCOKID — Shuffle Leaderboard

A React + Vite affiliate site for code **SISCO**: a home page (hero, bonus
cards, leaderboard promo) and a **leaderboard** page for the $3,000 monthly
Shuffle board, plus a `/winners` archive of finished months.

Design ported from the [nsbrooklyn](https://github.com/aspct49-dev/nsbrooklyn)
site (navbar shell, podium, bonus cards, promo banner) recolored to the
SISCOKID black + red colorway from the original
[siscokid](https://github.com/aspct49-dev/siscokid) site.

## Tech
- **React 18 + Vite** SPA, **React Router** (`/` home, `/leaderboard`,
  `/winners`, plus legal pages).
- **Live standings** via `/api/leaderboard`, a Vercel serverless function
  (also mounted by the Vite dev server) that proxies **Shuffle** —
  `affiliate.shuffle.com/wager/<affiliate-id>` (public ID, no key needed;
  retried server-side because the endpoint rate-limits with
  `400 TOO_MANY_REQUEST`). Responses are cached in memory per warm instance;
  stale data is served through upstream failures. Until live data arrives
  the UI renders the placeholder players from `src/data/leaderboard.js` —
  and once it's fetched, an empty result (nobody has wagered yet this month)
  is trusted and shown as "No wagers yet", never papered over with
  placeholders.
- The board covers the current **Eastern-time calendar month**.

## Getting started
```bash
npm install
npm run dev       # http://localhost:5173
```
- `npm run build` → production build in `dist/`
- `npm run preview` → preview the production build locally

## Environment variables
Nothing is required — Shuffle works with no key. `.env.example` documents
the one optional override (a different Shuffle affiliate ID), which you'd
set in the Vercel dashboard (Project → Settings → Environment Variables) or
in `.env.local` for dev.

## Editing content
Almost everything is in [`src/data/leaderboard.js`](src/data/leaderboard.js):
- `config.referralCode`, `config.socials`, `config.promo`, `config.prizePool`.
- `casinos[]` — currently just Shuffle: name, affiliate URL, logo, prize
  ladder, and the placeholder `players` list (names are masked on render).
- `bonuses` — the home-page bonus cards.
- `pastWinners` — historical `/winners` periods. Newer months are added by
  hand each month — see below.

Colors live in the `:root` block of [`src/index.css`](src/index.css).

## Past winners
There's no server-side persistence to auto-archive to on Vercel (serverless
functions have no writable, durable disk), so a finished month is added by
hand once it closes:

```bash
node scripts/snapshot-leaderboard.mjs                 # previous ET month
node scripts/snapshot-leaderboard.mjs --month=2026-07  # a specific month
```

It fetches that month's final Shuffle standings and prints a ready-to-paste
object — paste it at the top of the `pastWinners` array in
`src/data/leaderboard.js`, commit, and push. Vercel redeploys and the month
shows on `/winners`.

## Deploy
[Vercel](https://vercel.com) (Hobby/free plan is enough — no environment
variables required). Import the GitHub repo with the **Vite** preset.
`vercel.json` rewrites all non-`/api` routes to `index.html` for React
Router; the `api/` directory deploys automatically as serverless functions.

```bash
git push origin main   # Vercel redeploys automatically on push, once connected
```
