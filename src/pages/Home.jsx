import { config, casinos } from '../data/leaderboard'
import { fmtMoney } from '../utils'
import BonusCards from '../components/BonusCards'
import PromoBanner from '../components/PromoBanner'
import { IconExternal } from '../components/icons'

const [shuffle] = casinos

export default function Home() {
  return (
    <>
      {/* HERO */}
      <div className="container">
        <section className="hero">
          <img className="hero-art" src="/siscokid.png" alt="" aria-hidden="true" />
          <div className="hero-inner">
            <span className="hero-tag"><span className="dot" /> SHUFFLE PARTNER · CODE {config.referralCode}</span>
            <h1>
              <span className="grad">{fmtMoney(config.prizePool)}</span><br />
              LEADERBOARD
            </h1>
            <p>
              Climb to the top of the {shuffle.name} leaderboard under
              code <strong>{config.referralCode}</strong> and win your share of crazy prizes.
            </p>
            <div className="code-row">
              <div className="code-chip">
                <span className="label">USE CODE</span>
                <span className="code">{config.referralCode}</span>
              </div>
            </div>
            <div className="hero-actions">
              <a className="btn btn-primary" href={shuffle.url} target="_blank" rel="noreferrer">
                Play on {shuffle.name} <IconExternal />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* BONUS CARDS */}
      <BonusCards />

      {/* LEADERBOARD PROMO */}
      <PromoBanner />
    </>
  )
}
