import { LogOut, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

type DashboardMobileHeaderProps = {
  onSettingsClick: () => void
  onLogout: () => void
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-hero-text/80 transition-colors hover:bg-white/10 hover:text-hero-text"
      aria-label={label}
    >
      {children}
    </button>
  )
}

export function DashboardMobileHeader({ onSettingsClick, onLogout }: DashboardMobileHeaderProps) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-20 lg:hidden',
        'border-b border-white/10 bg-petrol-deep/95 shadow-[0_4px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl',
        'pt-[env(safe-area-inset-top,0px)]',
      )}
      aria-label="Cabecera del dashboard"
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center"
          aria-label="Expansión - Panel principal"
        >
          <img src={logo} alt="Expansión" className="h-9 w-auto object-contain sm:h-10" />
        </Link>

        <div className="flex items-center gap-2">
          <HeaderIconButton label="Configuración" onClick={onSettingsClick}>
            <Settings className="h-5 w-5" aria-hidden="true" />
          </HeaderIconButton>

          <HeaderIconButton label="Cerrar sesión" onClick={onLogout}>
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </HeaderIconButton>
        </div>
      </div>
    </header>
  )
}
