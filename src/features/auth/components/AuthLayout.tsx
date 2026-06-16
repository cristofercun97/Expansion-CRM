import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { APP_TAGLINE } from '@/config/app'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-teal-accent/15 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-teal-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-br from-hero-bg via-[#062F36]/40 to-hero-bg" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/">
            <img src={logo} alt="Expansión" className="h-14 w-auto object-contain sm:h-16" />
          </Link>
          <p className="mt-2 text-xs tracking-wide text-hero-text/50">{APP_TAGLINE}</p>
        </div>

        {children}
      </div>
    </div>
  )
}
