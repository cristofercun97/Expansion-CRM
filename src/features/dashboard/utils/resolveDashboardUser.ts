import type { DashboardUserIdentity } from '@/features/dashboard/types/dashboard.types'
import type { AppUser } from '@/types'
import type { User } from 'firebase/auth'

function getDashboardBadgeLabel(appUser: AppUser | null): string {
  if (appUser?.role === 'admin') {
    return 'Administrador'
  }

  if (appUser?.activationStatus === 'active') {
    return 'Constructor'
  }

  return 'Miembro'
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getFirstName(rawName: string, email: string): string {
  if (rawName) {
    return rawName.split(/\s+/)[0] ?? rawName
  }

  if (email) {
    return email.split('@')[0] ?? 'Usuario'
  }

  return 'Usuario'
}

export function resolveDashboardUser(
  appUser: AppUser | null,
  currentUser: User | null,
): DashboardUserIdentity {
  const profileEmail = appUser?.email?.trim() || currentUser?.email?.trim() || ''
  const rawName = appUser?.displayName?.trim() || currentUser?.displayName?.trim() || ''
  const displayName = rawName || profileEmail || 'Usuario'

  return {
    displayName,
    email: profileEmail,
    firstName: getFirstName(rawName, profileEmail),
    roleLabel: getDashboardBadgeLabel(appUser),
    initials: getInitials(rawName || displayName) || 'U',
  }
}
