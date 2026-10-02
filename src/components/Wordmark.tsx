import { Link } from 'react-router-dom'

export function Logo({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <rect x="1" y="12" width="5" height="6" rx="1.25" className="fill-pass" />
      <rect x="7.5" y="7" width="5" height="11" rx="1.25" className="fill-pass" />
      <rect x="14" y="2" width="5" height="16" rx="1.25" className="fill-amber" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-md text-[17px] font-semibold tracking-tight text-text">
      <Logo />
      Staged
    </Link>
  )
}
