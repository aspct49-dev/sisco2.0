import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import { useLeaderboard, getCasinoRange } from '../hooks/useLeaderboard'
import Countdown from '../components/Countdown'
import Podium from '../components/Podium'
import LeaderboardTable from '../components/LeaderboardTable'
import CasinoBrand from '../components/CasinoBrand'
import { IconExternal } from '../components/icons'

export default function Leaderboard() {
  const { players, casino, error, loading, hasData } = useLeaderboard(casinos[0].id)
  const top3 = players.slice(0, 3)
  // Countdown ticks to the end of the same period the API is queried with
  // (the current Eastern-time calendar month).
  const periodEnd = getCasinoRange(casino.id).to

  return (
    <section className="section" id="leaderboard">
      <div className="container">
        {/* HEADER */}
        <div className="lb-hero">
          <div className="lb-brand">
            <CasinoBrand casino={casino} />
          </div>
          <h1 className="lb-title">
            <span className="grad">{fmtMoney(casino.prizePool)}</span> <span className="white">Monthly</span><br />
            <span className="grad">Leaderboard</span>
          </h1>
          <p className="lb-sub">
            Compete against other players under code {config.referralCode} and win big rewards!
          </p>

          <div className="lb-actions">
            <div className="code-chip">
              <span className="label">CODE:</span>
              <span className="code">{config.referralCode}</span>
            </div>
            <a className="btn btn-primary" href={casino.url} target="_blank" rel="noreferrer">
              Visit {casino.name} <IconExternal />
            </a>
          </div>
        </div>

        {players.length > 0 && <Podium top3={top3} />}

        <div className="lb-ends-lbl">Leaderboard ends in</div>
        <Countdown endDate={periodEnd} />

        {/* A month with no wagers yet is the normal state on the 1st — say so
            plainly rather than rendering an empty podium and table. That's a
            DIFFERENT case from a fetch that never succeeded (hasData false,
            error set), which must say so rather than claim the board is
            empty. */}
        {loading ? (
          <div className="lb-status">Loading standings…</div>
        ) : !hasData && error ? (
          <div className="lb-status">
            <strong>Live leaderboard temporarily unavailable.</strong>
            <br />
            We couldn’t reach {casino.name} just now — standings will appear here
            as soon as we can. Try refreshing in a minute.
          </div>
        ) : players.length === 0 ? (
          <div className="lb-status">
            <strong>No wagers yet this month.</strong>
            <br />
            Be the first — wager on {casino.name} under code {config.referralCode} and
            you’ll appear here automatically.
          </div>
        ) : (
          <LeaderboardTable rows={players} startRank={1} />
        )}

        <p className="section-sub" style={{ textAlign: 'center', marginTop: 22, fontSize: 13 }}>
          Usernames are masked for privacy. Standings update as wagers are processed.
        </p>
      </div>
    </section>
  )
}
