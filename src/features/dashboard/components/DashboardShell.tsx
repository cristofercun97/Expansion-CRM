import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { DashboardMobileBottomNav } from '@/features/dashboard/components/DashboardMobileBottomNav'
import { DashboardMobileHeader } from '@/features/dashboard/components/DashboardMobileHeader'
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
  const navigate = useNavigate()
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

  const handleSettingsClick = useCallback(() => {
    navigate('/dashboard/configuracion')
  }, [navigate])

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
          'min-h-screen overflow-x-hidden transition-[margin-left] duration-300 ease-in-out',
          isDesktop && (effectiveCollapsed ? 'ml-[4.5rem]' : 'ml-64'),
          !isDesktop &&
            'ml-0 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
        )}
      >
        {!isDesktop ? (
          <DashboardMobileHeader onSettingsClick={handleSettingsClick} onLogout={onLogout} />
        ) : null}

        {children}

        {!isDesktop ? <DashboardMobileBottomNav /> : null}
      </div>
    </div>
  )
}
