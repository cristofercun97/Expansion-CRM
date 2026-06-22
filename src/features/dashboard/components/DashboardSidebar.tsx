import {
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { DashboardNavItem, DashboardUserIdentity } from '@/features/dashboard/types/dashboard.types'
import {
  isDashboardNavItemLocked,
  resolveDashboardNavItems,
} from '@/features/dashboard/utils/dashboardNav.utils'
import { cn } from '@/lib/utils'

type DashboardSidebarProps = {
  user: DashboardUserIdentity
  onLogout: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  isDesktop: boolean
}

type SidebarLinkProps = DashboardNavItem & {
  collapsed: boolean
  locked?: boolean
}

function SidebarLink({ label, to, icon: Icon, end, placeholder, collapsed, locked }: SidebarLinkProps) {
  const tooltip = locked ? `${label} — Requiere Activación de grupo` : placeholder ? 'Próximamente' : label

  if (placeholder) {
    return (
      <span
        className={cn(
          'flex items-center rounded-xl py-2.5 text-sm font-medium text-hero-text/45',
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
        )}
        aria-disabled="true"
        title={tooltip}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed ? <span className="truncate">{label}</span> : null}
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? tooltip : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
          locked
            ? 'text-hero-text/50 hover:bg-white/5 hover:text-hero-text/70'
            : isActive
              ? cn(
                  'bg-white/10 text-hero-text',
                  collapsed ? 'ring-1 ring-gold/60' : 'border-l-2 border-gold',
                )
              : 'text-hero-text/70 hover:bg-white/5 hover:text-hero-text',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed ? (
        <>
          <span className="truncate">{label}</span>
          {locked ? <Lock className="ml-auto h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" /> : null}
        </>
      ) : locked ? (
        <Lock className="absolute right-1 top-1 h-2.5 w-2.5 text-gold-light/80" aria-hidden="true" />
      ) : null}
    </NavLink>
  )
}

type FooterActionProps = {
  label: string
  icon: LucideIcon
  collapsed: boolean
  onClick?: () => void
  disabled?: boolean
}

function FooterAction({ label, icon: Icon, collapsed, onClick, disabled }: FooterActionProps) {
  const className = cn(
    'flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-2' : 'gap-3 px-3',
    disabled
      ? 'cursor-default text-hero-text/45'
      : 'cursor-pointer text-hero-text/70 hover:bg-white/5 hover:text-hero-text',
  )

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" title={collapsed ? 'Próximamente' : undefined}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed ? <span className="truncate">Configuración</span> : null}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </button>
  )
}

export function DashboardSidebar({
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  isDesktop,
}: DashboardSidebarProps) {
  const { appUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const navItems = resolveDashboardNavItems(location.pathname, appUser, 'sidebar')
  const showEmail = user.email.length > 0 && user.displayName !== user.email
  const profileTitle = showEmail ? `${user.displayName} — ${user.email}` : user.displayName

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-petrol-deep/95 backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[4.5rem]' : 'w-64',
        isDesktop ? 'translate-x-0' : mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}
      aria-label="Menú lateral"
    >
      {/* Cabecera: logo + botón plegar/desplegar */}
      <div
        className={cn(
          'flex items-center border-b border-white/10',
          collapsed ? 'justify-center px-2 py-4' : 'justify-between gap-2 px-4 py-4',
        )}
      >
        {!collapsed ? (
          <img src={logo} alt="Expansión" className="h-12 w-auto object-contain" />
        ) : null}

        {isDesktop ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Navegación principal */}
      <nav
        className={cn('flex-1 space-y-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}
        aria-label="Menú principal"
      >
        {navItems.map((item) => (
          <SidebarLink
            key={item.label}
            {...item}
            collapsed={collapsed}
            locked={isDashboardNavItemLocked(item, location.pathname, appUser)}
          />
        ))}
      </nav>

      {/* Footer: configuración, cerrar sesión y perfil */}
      <div className={cn('border-t border-white/10 py-4', collapsed ? 'px-2' : 'px-3')}>
        <FooterAction
          label="Configuración"
          icon={Settings}
          collapsed={collapsed}
          onClick={() => navigate('/dashboard/configuracion')}
        />

        <FooterAction
          label="Cerrar sesión"
          icon={LogOut}
          collapsed={collapsed}
          onClick={onLogout}
        />

        <div
          className={cn(
            'mt-4 flex items-center rounded-xl bg-white/5',
            collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-3',
          )}
          title={collapsed ? profileTitle : undefined}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold-light"
            aria-hidden="true"
          >
            {user.initials}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-hero-text">{user.displayName}</p>
              {showEmail ? (
                <p className="truncate text-xs text-hero-text/55">{user.email}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
