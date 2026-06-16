import type { UserRole } from '@/types'

export function normalizeRoleForAccess(role: UserRole | string | undefined): 'admin' | 'user' {
  if (role === 'admin') {
    return 'admin'
  }

  return 'user'
}

export function getDashboardPathByRole(role: UserRole | string | undefined): string {
  return normalizeRoleForAccess(role) === 'admin' ? '/admin' : '/dashboard'
}

export function getPostAuthRedirect(
  isEmailVerified: boolean,
  role?: UserRole | string,
): string {
  if (!isEmailVerified) {
    return '/verificar-email'
  }

  return getDashboardPathByRole(role)
}

export function getRoleLabel(role: UserRole | string | undefined): string {
  if (role === 'admin') {
    return 'Administrador'
  }

  return 'Usuario'
}
