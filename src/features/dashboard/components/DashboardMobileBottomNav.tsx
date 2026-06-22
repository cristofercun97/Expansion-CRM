import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  getMobileNavLabel,
  resolveDashboardNavItems,
} from '@/features/dashboard/utils/dashboardNav.utils'
import { cn } from '@/lib/utils'

export function DashboardMobileBottomNav() {
  const { appUser } = useAuth()
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const navItems = resolveDashboardNavItems(location.pathname, appUser, 'mobile')

  useEffect(() => {
    const activeItem = scrollRef.current?.querySelector<HTMLElement>('[data-nav-active="true"]')

    activeItem?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [location.pathname])

  if (navItems.length === 0) {
    return null
  }

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:hidden"
      aria-label="Navegación inferior"
    >
      <div
        className={cn(
          'pointer-events-auto mx-auto max-w-lg rounded-[32px] border border-gold/12',
          'bg-petrol-deep/78 shadow-[0_12px_48px_rgba(0,0,0,0.42),0_0_48px_rgba(106,197,188,0.05),0_0_32px_rgba(217,164,65,0.07)]',
          'backdrop-blur-xl ring-1 ring-inset ring-white/5',
        )}
      >
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide px-3 py-2.5 sm:px-4 sm:py-3"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const label = getMobileNavLabel(item)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                aria-label={item.label}
                className="shrink-0"
              >
                {({ isActive }) => (
                  <span
                    data-nav-active={isActive ? 'true' : undefined}
                    className={cn(
                      'flex min-w-[4.5rem] flex-col items-center gap-1 rounded-[22px] px-3 py-2 transition-all duration-200 sm:min-w-[4.75rem]',
                      isActive
                        ? 'border border-gold/22 bg-gradient-to-b from-gold/16 via-gold/10 to-teal-accent/8 text-gold-light shadow-[0_4px_20px_rgba(217,164,65,0.14),inset_0_1px_0_rgba(255,255,255,0.06)]'
                        : 'border border-transparent text-hero-text/48 active:bg-white/6 active:text-hero-text/75',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-[1.125rem] w-[1.125rem] shrink-0 transition-colors sm:h-5 sm:w-5',
                        isActive ? 'text-gold-light' : 'text-hero-text/55',
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'max-w-[4.25rem] truncate text-center text-[10px] font-medium leading-tight tracking-wide sm:max-w-[4.5rem]',
                        isActive ? 'font-semibold text-gold-light' : 'text-hero-text/50',
                      )}
                    >
                      {label}
                    </span>
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
