import { ArrowRight, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { Button } from '@/components/ui'

export function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-hero-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex shrink-0 items-center">
          <img
            src={logo}
            alt="Expansión"
            className="h-10 w-auto object-contain sm:h-12 md:h-14 lg:h-[66px]"
          />
        </Link>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <Link to="/login">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent px-2.5 text-hero-text hover:border-teal-accent hover:bg-teal-accent/10 sm:px-3"
              aria-label="Iniciar sesión"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Button>
          </Link>
          <Link to="/registro">
            <Button
              size="sm"
              className="bg-gold px-2.5 text-hero-bg hover:bg-gold-light sm:px-3"
            >
              Comenzar
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
