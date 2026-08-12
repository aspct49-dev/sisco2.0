// Shared server-side leaderboard fetcher WITH caching.
// Used by the Vercel function (api/leaderboard.js), the Vite dev middleware
// (vite.config.js) and scripts/snapshot-leaderboard.mjs. Secrets come from
// environment variables — they must NEVER be imported by client code in src/.
//
// Caching model (protects against Shuffle's aggressive rate limiting):
//   - fresh cache (< TTL)          → served directly, upstream never called
//   - stale cache + upstream OK    → cache refreshed, new data served
//   - stale cache + upstream fails → stale data served (marked `stale`)
//   - after a 429, a cooldown stops upstream retries for a while;
//     stale data keeps being served during the cooldown
//   - concurrent requests for the same key share one upstream call
//
// The cache is an in-memory Map, so it only helps within one warm serverless
// instance — a cold start just fetches fresh, which is correct, not a bug.

const CACHE_TTL_MS = 2 * 60_000        // serve cached data without re-polling
const RATE_LIMIT_COOLDOWN_MS = 10 * 60_000 // after a 429, back off this long
const ERROR_COOLDOWN_MS = 60_000       // after other upstream errors
// When there's no stale data to fall back on, a long cooldown means a single
// unlucky retry-exhaustion turns into a full outage with nothing to show —
// invisible on an always-warm server (there's usually something stale to
// serve), but very visible on a cold serverless instance. Recover fast instead.
const NO_FALLBACK_COOLDOWN_MS = 20_000

const cache = new Map()    // key -> { data, fetchedAt }
const cooldownUntil = new Map() // key -> timestamp
const inflight = new Map() // key -> Promise

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

export function assertIso(value, name) {
  if (!ISO_RE.test(value || '')) {
    const err = new Error(`Invalid or missing "${name}" (expect ISO UTC datetime)`)
    err.status = 400
    throw err
  }
}

function upstreamError(name, res) {
  // preserve 429 so callers can back off; everything else is a 502
  const status = res.status === 429 ? 429 : 502
  return Object.assign(new Error(`${name} API ${res.status}`), { status })
}

// Public affiliate ID for code SISCO — it's visible in the public wager URL,
// so it isn't a secret, but it can still be overridden via env.
const SHUFFLE_AFFILIATE_ID = '9ab3853d-dc5a-40f6-bad6-d7594ac9cff7'

// Shuffle's endpoint aggressively rate-limits: most requests get
// HTTP 400 {"message":"TOO_MANY_REQUEST"}. Retry a few times, and when it's
// still limited, surface it as a 429 so the caching layer below applies the
// long cooldown and serves stale data instead of hammering the API.
async function fetchShuffle({ from, to, env }) {
  const affiliateId = env.SHUFFLE_AFFILIATE_ID || SHUFFLE_AFFILIATE_ID
  const nowSec = Math.floor(Date.now() / 1000)
  const startTime = Math.floor(new Date(from).getTime() / 1000)
  const endTime = Math.min(Math.floor(new Date(to).getTime() / 1000), nowSec)
  const url = `https://affiliate.shuffle.com/wager/${affiliateId}?startTime=${startTime}&endTime=${endTime}`

  let lastRes
  let rateLimited = false
  let body
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url)
    lastRes = res
    if (res.ok) {
      body = await res.json()
      break
    }
    const errBody = await res.text().catch(() => '')
    rateLimited = res.status === 429 || errBody.includes('TOO_MANY_REQUEST')
    await new Promise((r) => setTimeout(r, 700))
  }
  if (!Array.isArray(body)) {
    if (rateLimited) throw Object.assign(new Error('Shuffle API rate-limited'), { status: 429 })
    throw upstreamError('Shuffle', lastRes)
  }

  return body
    .map((u) => ({
      name: u.username ?? 'anonymous',
      wagered: Number(u.weightedWagerAmount) || 0,
    }))
    .filter((u) => u.wagered > 0)
}

const FETCHERS = { shuffle: fetchShuffle }

async function fetchFresh({ casino, from, to, env, key }) {
  try {
    const players = await FETCHERS[casino]({ from, to, env })
    players.sort((a, b) => b.wagered - a.wagered)
    const data = { players, updatedAt: new Date().toISOString() }
    cache.set(key, { data, fetchedAt: Date.now() })
    cooldownUntil.delete(key)
    return data
  } catch (err) {
    const stale = cache.get(key)
    const cooldown = !stale
      ? NO_FALLBACK_COOLDOWN_MS
      : err.status === 429 ? RATE_LIMIT_COOLDOWN_MS : ERROR_COOLDOWN_MS
    cooldownUntil.set(key, Date.now() + cooldown)
    if (stale) return { ...stale.data, stale: true }
    throw err
  } finally {
    inflight.delete(key)
  }
}

/**
 * Cached fetch + normalize of one casino's standings.
 * @returns {{ players: {name, wagered}[], updatedAt: string, stale?: boolean, cached?: boolean }}
 */
export async function getLeaderboard({ casino, from, to, env }) {
  if (!FETCHERS[casino]) throw Object.assign(new Error(`Unknown casino "${casino}"`), { status: 400 })
  assertIso(from, 'from')
  assertIso(to, 'to')

  const key = `${casino}:${from}:${to}`
  const hit = cache.get(key)
  const now = Date.now()

  // fresh enough — don't touch the upstream API at all
  if (hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return { ...hit.data, cached: true }
  }

  // recently rate-limited/errored — don't retry upstream yet:
  // serve stale if we have it, otherwise fail fast without a call
  if ((cooldownUntil.get(key) || 0) > now) {
    if (hit) return { ...hit.data, stale: true }
    throw Object.assign(new Error('Upstream rate-limited — retrying later'), { status: 429 })
  }

  // coalesce concurrent requests into a single upstream call
  if (inflight.has(key)) return inflight.get(key)
  const p = fetchFresh({ casino, from, to, env, key })
  inflight.set(key, p)
  return p
}
