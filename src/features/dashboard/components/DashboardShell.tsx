import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DashboardMobileBottomNav } from '@/features/dashboard/components/DashboardMobileBottomNav'
import { DashboardMobileHeader } from '@/features/dashboard/components/DashboardMobileHeader'
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar'
import { NotificationsBell } from '@/features/notifications/components/NotificationsBell'
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
  const { currentUser } = useAuth()
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const effectiveCollapsed = collapsed && isDesktop
  const notificationUid = currentUser?.uid?.trim() || ''

  if (isDesktop && mobileOpen) {
    setMobileOpen(false)
  }

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false)
  }, [])

  const handleSettingsClick = useCallback(() => {
    navigate('/dashboard/configuracion')
  }, [navigate])

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

      {isDesktop && notificationUid ? (
        <div className="fixed right-5 top-4 z-20">
          <NotificationsBell uid={notificationUid} />
        </div>
      ) : null}

      <div
        className={cn(
          'min-h-screen overflow-x-hidden transition-[margin-left] duration-300 ease-in-out',
          isDesktop && (effectiveCollapsed ? 'ml-[4.5rem]' : 'ml-64'),
          !isDesktop &&
            'ml-0 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]',
        )}
      >
        {!isDesktop ? (
          <DashboardMobileHeader
            onSettingsClick={handleSettingsClick}
            onLogout={onLogout}
            notificationsSlot={
              notificationUid ? <NotificationsBell uid={notificationUid} /> : null
            }
          />
        ) : null}

        {children}

        {!isDesktop ? <DashboardMobileBottomNav /> : null}
      </div>
    </div>
  )
}
