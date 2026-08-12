import { useEffect, useMemo, useState } from 'react'
import { casinos, config } from '../data/leaderboard'

// Assign a prize to each player by rank, sort by wager (desc), and cap to the
// number of prize slots so we only ever show ranked, paid positions.
function rank(players, prizes) {
  return [...players]
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, prizes.length)
    .map((p, i) => ({ ...p, prize: prizes[i] || 0 }))
}

const REFRESH_MS = 600_000
const RETRY_MS = 180_000
const RATE_LIMIT_MS = 600_000

// Module-level cache so tab switches / multiple components don't refetch.
const cache = new Map() // cacheKey -> { players, updatedAt }
const listeners = new Set()

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

// Both boards run the current Eastern-time (America/New_York) calendar month:
// midnight ET on the 1st through midnight ET on the 1st of the next month.
function getMonthRange(date) {
  const et = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric' })
    .formatToParts(date).reduce((a, x) => ((a[x.type] = x.value), a), {})
  const start = etMonthStartUTC(+et.year, +et.month - 1)
  const end = etMonthStartUTC(+et.year, +et.month) - 1000 // last second of the month
  return { from: new Date(start).toISOString(), to: new Date(end).toISOString() }
}

// Exported so the page countdown can tick to the same period end the API
// is actually queried with.
export function getCasinoRange() {
  return getMonthRange(new Date())
}

function cacheKeyFor(casinoId, range) {
  return `${casinoId}:${range.from}:${range.to}`
}

async function refresh(casinoId, range) {
  const qs = new URLSearchParams({ casino: casinoId, from: range.from, to: range.to })
  const res = await fetch(`/api/leaderboard?${qs}`)
  if (!res.ok) {
    let message = `api ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch (err) {
      /* ignore parse errors */
    }
    throw Object.assign(new Error(message), { status: res.status })
  }
  const data = await res.json()
  if (!Array.isArray(data.players)) throw new Error('bad payload')
  cache.set(cacheKeyFor(casinoId, range), data)
  listeners.forEach((fn) => fn())
}

/**
 * Ranked standings for one casino (defaults to the first).
 * Fetches live data from /api/leaderboard (which proxies the casino APIs
 * server-side); until it arrives — or if it fails — falls back to the
 * placeholder players in src/data/leaderboard.js so the UI always renders.
 */
export function useLeaderboard(casinoId = casinos[0].id) {
  const casino = casinos.find((c) => c.id === casinoId) ?? casinos[0]
  const [, force] = useState(0)
  const [error, setError] = useState(null)
  const range = getCasinoRange(casino.id)
  const cacheKey = cacheKeyFor(casino.id, range)

  useEffect(() => {
    const bump = () => force((n) => n + 1)
    listeners.add(bump)

    let timer
    const tick = async () => {
      let delay = REFRESH_MS
      try {
        await refresh(casino.id, getCasinoRange(casino.id))
        setError(null)
      } catch (err) {
        setError(err.message || 'Leaderboard fetch failed')
        if (err.status === 429 || String(err.message).includes('429')) {
          delay = RATE_LIMIT_MS
        } else {
          delay = RETRY_MS
        }
      }
      timer = setTimeout(tick, delay)
    }

    if (!cache.has(cacheKey)) tick()

    return () => {
      listeners.delete(bump)
      clearTimeout(timer)
    }
  }, [cacheKey, casino.id])

  const live = cache.get(cacheKey)
  // An empty live response is a real answer ("nobody has wagered yet this
  // month"), NOT missing data — never paper over it with the placeholder
  // players, or a fresh month shows fake standings.
  const source = live?.players ?? []

  const players = useMemo(
    () => rank(source, casino.prizes),
    [source, casino],
  )

  return {
    loading: !live && !error,
    // True only once a fetch has actually succeeded at least once — lets
    // callers tell "confirmed empty month" apart from "never got a
    // response" (which otherwise both look like `players.length === 0`).
    hasData: !!live,
    error,
    players,
    casino,
  }
}
