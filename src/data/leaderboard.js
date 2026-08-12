// ============================================================================
//  SISCOKID LEADERBOARDS — EDIT EVERYTHING HERE
// ----------------------------------------------------------------------------
//  This is the only file you need to touch to update the site's content.
//  Change the prize pools, the casinos/code, the countdown end date, and the
//  player lists below. The site rebuilds the podium + tables automatically.
// ============================================================================

export const config = {
  brandName: 'SISCOKID',
  referralCode: 'SISCO',
  // Shown on the legal pages. TODO: replace with your real support email
  // (or leave it — the legal pages also point users to your Discord).
  contactEmail: 'support@siscorewards.com',
  prizePool: 3000, // Shuffle leaderboard pool, shown in the hero

  // Joined with this on legal pages / footer.
  casinoNames: 'Shuffle',

  // The active leaderboard period (dates inclusive, 'YYYY-MM-DD'). The board
  // runs the current calendar month (Eastern time); the countdown ticks to
  // the period end computed in src/hooks/useLeaderboard.js, so this only
  // matters as a display fallback. Update each period.
  leaderboard: {
    startAt: '2026-07-01',
    endAt: '2026-07-31',
  },

  // Decorative profile pictures by rank (1st, 2nd, 3rd). Ranks past this list
  // fall back to the player's initial. Files live in /public.
  rankAvatars: [],

  socials: {
    discord: 'https://discord.gg/sisco',
    x: 'https://x.com/SiscoKid',
    kick: 'https://kick.com/siscokid',
  },

  // Promo banner under the bonus cards on the home page. The top-3 winner
  // cards pull from the casino's board so they match the leaderboard.
  promo: {
    amount: 3000,
    title: 'LEADERBOARD',
    subtitle: 'Climb to the top of the leaderboard & win crazy prizes!',
    cta: 'View Leaderboard',
    to: '/leaderboard',
  },
}

// Prize ladder, 1st → 10th. Sums to $3,000.
const SHUFFLE_PRIZES = [1000, 700, 500, 250, 175, 125, 100, 75, 50, 25]

// ============================================================================
//  CASINOS — one entry per partner site. `prizes` are per rank, 1st → last;
//  players are ranked by wagered amount. (The list sums to the pool below.)
// ============================================================================
export const casinos = [
  {
    id: 'shuffle',
    name: 'Shuffle',
    url: 'https://shuffle.com/?r=Sisco',
    logo: '/shuffle_logo2.webp', // transparent wordmark (already light)
    prizePool: 3000,
    prizes: SHUFFLE_PRIZES,
    // Placeholder standings — shown until the live API data arrives. Names
    // are masked on render ("BlazeKing" -> "B*******g"), so full names are fine.
    players: [
      { name: 'stackedbagg', wagered: 324750 },
      { name: 'jazzhandz', wagered: 187420 },
      { name: 'kingofspins', wagered: 156890 },
      { name: 'rowdyy', wagered: 98540 },
      { name: 'maxwane', wagered: 87330 },
      { name: 'nyquix', wagered: 72150 },
      { name: 'vandaleyes', wagered: 64890 },
      { name: 'dexterz', wagered: 58420 },
      { name: 'blazetrail', wagered: 49830 },
      { name: 'luckyshoes', wagered: 41275 },
    ],
  },
]

// The four "choose your bonus" cards on the home page.
// `featured: true` gives the highlighted treatment.
// Rows are strings; use { group: '...' } to insert a small section label.
export const bonuses = [
  {
    img: '/drink.png',
    title: 'SHUFFLE',
    subtitle: 'Under code SISCO',
    accent: 'gold',
    rows: [
      '100% deposit bonus',
      'With a 35x wager',
      'Weekly & monthly bonuses',
      'Exclusive VIP program',
    ],
    cta: 'CLAIM BONUS',
    href: 'https://shuffle.com/?r=Sisco',
  },
  {
    img: '/orb.png',
    title: '$3,000', // tip: keep in sync with config.prizePool
    subtitle: 'Leaderboard Pool',
    accent: 'gold',
    featured: true,
    rows: [
      'Must be under code SISCO',
      'Wager on Shuffle',
      'Climb to secure Top Places',
      'Win big rewards & enjoy!',
    ],
    cta: 'VIEW LEADERBOARD',
    to: '/leaderboard',
  },
  {
    img: '/red_gem.png',
    title: 'SISCOKID',
    subtitle: 'From me personally',
    accent: 'gold',
    rows: [
      '$3,000 monthly leaderboard',
      'Exclusive giveaways on stream',
      'Bonus drops in Discord',
    ],
    cta: 'CLAIM VIA DISCORD',
    href: config.socials.discord,
  },
]

// Past leaderboard periods for the /winners page, newest first.
//
// Completed months are archived automatically by scripts/snapshot-leaderboard.mjs
// (run monthly on the server) and served from /api/winners — the page merges
// those in on top of this list. The entries below are the historical months
// carried over from the previous siscokid site, before that pipeline existed.
export const pastWinners = [
  {
    // id format matches the snapshot script (`YYYY-MM-<casinoId>`) so a
    // re-archived month replaces this entry instead of duplicating it.
    id: '2026-06-shuffle',
    label: 'June 2026',
    casino: 'Shuffle',
    prizePool: 3000,
    winners: [
      { rank: 1, name: 'SauulGoodMan', wagered: 32292.85, prize: 1000 },
      { rank: 2, name: 'lascio', wagered: 21944.61, prize: 700 },
      { rank: 3, name: 'SiscosLeftNut', wagered: 21205.39, prize: 500 },
      { rank: 4, name: 'codylee09299', wagered: 18264.26, prize: 250 },
      { rank: 5, name: 'NGRmaki', wagered: 11733.6, prize: 175 },
      { rank: 6, name: 'RonniePajamas', wagered: 10758.28, prize: 125 },
      { rank: 7, name: 'phonymcring', wagered: 8498.1, prize: 100 },
      { rank: 8, name: 'NoDebtPliz', wagered: 6051.44, prize: 75 },
      { rank: 9, name: 'cuppatea', wagered: 5794.85, prize: 50 },
      { rank: 10, name: 'MadManMattyD', wagered: 3146.37, prize: 25 },
    ],
  },
  {
    id: '2026-05-shuffle',
    label: 'May 2026',
    casino: 'Shuffle',
    prizePool: 3000,
    winners: [
      { rank: 1, name: 'codylee09299', wagered: 83613.6, prize: 1000 },
      { rank: 2, name: 'SauulGoodMan', wagered: 26152.71, prize: 700 },
      { rank: 3, name: 'SiscosLeftNut', wagered: 25778.03, prize: 500 },
      { rank: 4, name: 'MadManMattyD', wagered: 19936.2, prize: 250 },
      { rank: 5, name: 'Yunxio', wagered: 17607.93, prize: 175 },
      { rank: 6, name: 'RonniePajamas', wagered: 7118.64, prize: 125 },
      { rank: 7, name: 'NGRmaki', wagered: 6522.1, prize: 100 },
      { rank: 8, name: 'wacost', wagered: 5696.31, prize: 75 },
      { rank: 9, name: 'phonymcring', wagered: 5599.32, prize: 50 },
      { rank: 10, name: 'NoDebtPliz', wagered: 5489.41, prize: 25 },
    ],
  },
]
