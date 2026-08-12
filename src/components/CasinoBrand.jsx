// Casino wordmark, sized in em — set font-size on a wrapper to scale it.
export default function CasinoBrand({ casino }) {
  return (
    <span className="casino-brand">
      <img className="cb-logoimg" src={casino.logo} alt={casino.name} />
    </span>
  )
}
