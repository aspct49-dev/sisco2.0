// Fetches the PREVIOUS Eastern-time calendar month's final Shuffle standings
// and prints a ready-to-paste `pastWinners` entry for src/data/leaderboard.js.
//
// There's no server-side persistence to archive to on Vercel (functions have
// no writable, durable disk), so this is a manual monthly step instead of an
// automated job: run it once the month has closed, paste the printed object
// at the top of the `pastWinners` array, commit, and push — Vercel redeploys
// and the new month shows on /winners. Shuffle's API needs no key and
// retains history, so this can be run from anywhere (not just a server).
//
//   node scripts/snapshot-leaderboard.mjs              # previous ET month
//   node scripts/snapshot-leaderboard.mjs --month=2026-07
import { getLeaderboard } from '../api/_lib/leaderboard.js'
import { casinos } from '../src/data/leaderboard.js'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// Offset (ms) such that Date.UTC(ET wall-clock parts) === actualUTC + offset.
function nyOffsetMs(date) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).reduce((a, x) => ((a[x.type] = x.value), a), {})
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime()
}

// UTC ms of midnight America/New_York on the 1st of the given ET month (month0 may overflow).
function etMonthStartUTC(year, month0) {
  const guess = Date.UTC(year, month0, 1, 0, 0, 0)
  return guess - nyOffsetMs(new Date(guess))
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)

// Target month: --month=YYYY-MM, else the ET month before the current one.
let year
let month0
if (typeof args.month === 'string') {
  const [y, m] = args.month.split('-').map(Number)
  if (!y || !m) throw new Error('--month must look like 2026-07')
  year = y
  month0 = m - 1
} else {
  const et = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric' })
    .formatToParts(new Date()).reduce((a, x) => ((a[x.type] = x.value), a), {})
  year = +et.year
  month0 = +et.month - 2 // previous month; Date.UTC handles the -1 rollover
}

const start = etMonthStartUTC(year, month0)
const end = etMonthStartUTC(year, month0 + 1) - 1000 // last second of the month
const from = new Date(start).toISOString()
const to = new Date(end).toISOString()
// normalize (handles month0 = -1 → December of the previous year)
const d = new Date(start + 86_400_000)
const etParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric' })
  .formatToParts(d).reduce((a, x) => ((a[x.type] = x.value), a), {})
const monthId = `${etParts.year}-${String(etParts.month).padStart(2, '0')}`
const label = `${MONTH_NAMES[+etParts.month - 1]} ${etParts.year}`

console.error(`Fetching ${label} (${from} → ${to})\n`)

const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`

for (const casino of casinos) {
  try {
    const data = await getLeaderboard({ casino: casino.id, from, to, env: process.env })
    const winners = [...data.players]
      .sort((a, b) => b.wagered - a.wagered)
      .slice(0, casino.prizes.length)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        wagered: Math.round(p.wagered * 100) / 100,
        prize: casino.prizes[i] || 0,
      }))

    if (!winners.length) {
      console.error(`${casino.name}: no players — nothing to paste`)
      continue
    }

    console.error(`${casino.name}: ${winners.length} winners (top: ${winners[0].name}) — paste into pastWinners:\n`)
    console.log('  {')
    console.log(`    id: ${q(`${monthId}-${casino.id}`)},`)
    console.log(`    label: ${q(label)},`)
    console.log(`    casino: ${q(casino.name)},`)
    console.log(`    prizePool: ${casino.prizePool},`)
    console.log('    winners: [')
    for (const w of winners) {
      console.log(`      { rank: ${w.rank}, name: ${q(w.name)}, wagered: ${w.wagered}, prize: ${w.prize} },`)
    }
    console.log('    ],')
    console.log('  },\n')
  } catch (err) {
    console.error(`${casino.name}: FAILED — ${err.message}`)
  }
}
