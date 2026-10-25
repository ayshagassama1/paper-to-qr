import { Link } from "react-router"

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--petrol)" />
      <path d="M9 7.5h9.5l4.5 4.5v12.5H9z" fill="#fff" />
      <path d="M18.5 7.5V12H23" fill="none" stroke="var(--hairline)" strokeWidth="1.2" />
      <rect x="12" y="15" width="3" height="3" rx="0.6" fill="var(--petrol)" />
      <rect x="17" y="15" width="3" height="3" rx="0.6" fill="var(--petrol)" />
      <rect x="12" y="20" width="3" height="3" rx="0.6" fill="var(--petrol)" />
      <rect x="17.5" y="20.5" width="2" height="2" rx="0.4" fill="var(--petrol)" />
    </svg>
  )
}

export function Navbar({ onHome }: { onHome?: () => void }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-5">
      <Link to="/" onClick={onHome} className="flex items-center gap-2.5 rounded-lg outline-offset-4">
        <Logo />
        <span className="font-display text-xl font-semibold tracking-tight text-ink">Paper to QR</span>
      </Link>
    </header>
  )
}
