import { Menu } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar'
import type { DashboardUserIdentity } from '@/features/dashboard/types/dashboard.types'

const DESKTOP_BREAKPOINT = 1024

type DashboardShellProps = {
  children: ReactNode
  user: DashboardUserIdentity
  onLogout: () => void
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const handleChange = () => setIsDesktop(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}

export function DashboardShell({ children, user, onLogout }: DashboardShellProps) {
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const effectiveCollapsed = collapsed && isDesktop

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false)
    }
  }, [isDesktop])

  return (
    <div className="min-h-screen bg-gradient-to-br from-hero-bg via-petrol-dark to-petrol-deep text-hero-text">
      {mobileOpen && !isDesktop ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Cerrar menú"
          onClick={handleMobileClose}
        />
      ) : null}

      <DashboardSidebar
        user={user}
        onLogout={onLogout}
        collapsed={effectiveCollapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        isDesktop={isDesktop}
      />

      <div
        className={cn(
          'min-h-screen transition-[margin-left] duration-300 ease-in-out',
          isDesktop && (effectiveCollapsed ? 'ml-[4.5rem]' : 'ml-64'),
          !isDesktop && 'ml-0',
        )}
      >
        {!isDesktop ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="fixed left-4 top-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-petrol-deep/90 text-hero-text shadow-lg backdrop-blur-md transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        {children}
      </div>
    </div>
  )
}
