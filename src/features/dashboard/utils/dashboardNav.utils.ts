import { adminNavItems } from '@/features/admin/constants/adminNavItems'
import { canAccessOwnerModules } from '@/features/access/utils/canAccessOwnerModules'
import { canSeeAcademyProgressNav } from '@/features/access/utils/canAccessAcademyProgress'
import { dashboardNavItems } from '@/features/dashboard/constants/dashboardDemoData'
import type { DashboardNavItem } from '@/features/dashboard/types/dashboard.types'
import type { AppUser } from '@/types'

const MOBILE_NAV_LABELS: Partial<Record<string, string>> = {
  '/dashboard': 'Inicio',
  '/dashboard/mi-grupo': 'Mi grupo',
  '/dashboard/recompensas': 'Recompensas',
  '/dashboard/presentacion': 'Presentación',
  '/dashboard/radar': 'Radar',
  '/dashboard/contactos': 'Contactos',
  '/dashboard/academia': 'Academia',
  '/dashboard/progreso-academia': 'Progreso',
  '/dashboard/progreso-equipo': 'Equipo',
  '/dashboard/plan': 'Plan',
  '/dashboard/reconocimientos': 'Premios',
  '/dashboard/configuracion': 'Ajustes',
  '/admin/activacion': 'Activación',
  '/admin/usuarios': 'Usuarios',
  '/admin/pagos': 'Pagos',
}

type DashboardNavSurface = 'sidebar' | 'mobile'

export function resolveDashboardNavItems(
  pathname: string,
  appUser: AppUser | null | undefined,
  surface: DashboardNavSurface,
): DashboardNavItem[] {
  const isAdmin = appUser?.role === 'admin'
  const isAdminArea = pathname.startsWith('/admin')
  const source = isAdminArea && isAdmin ? adminNavItems : dashboardNavItems
  const hasOwnerModuleAccess = canAccessOwnerModules(appUser)

  return source.filter((item) => {
    if (item.placeholder) {
      return false
    }

    if (item.activationOnly && !canSeeAcademyProgressNav(appUser)) {
      return false
    }

    if (surface === 'mobile' && !isAdminArea && item.ownerOnly && !hasOwnerModuleAccess) {
      return false
    }

    return true
  })
}

export function isDashboardNavItemLocked(
  item: DashboardNavItem,
  pathname: string,
  appUser: AppUser | null | undefined,
): boolean {
  const isAdminArea = pathname.startsWith('/admin')

  if (isAdminArea) {
    return false
  }

  return Boolean(item.ownerOnly && !canAccessOwnerModules(appUser))
}

export function getMobileNavLabel(item: DashboardNavItem): string {
  return MOBILE_NAV_LABELS[item.to] ?? item.label
}
