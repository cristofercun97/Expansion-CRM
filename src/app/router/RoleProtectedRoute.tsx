import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { normalizeRoleForAccess } from '@/features/auth/utils/getDashboardPathByRole'
import type { UserRole } from '@/types'

type RoleProtectedRouteProps = {
  children: ReactNode
  allowedRoles: UserRole[]
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { appUser, initialized, loading } = useAuth()

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-warm px-6">
        <p className="text-sm font-medium text-text-soft">Cargando tu sesión...</p>
      </div>
    )
  }

  if (!appUser) {
    return <Navigate to="/dashboard" replace />
  }

  const effectiveRole = normalizeRoleForAccess(appUser.role)
  const allowed = allowedRoles.some((role) => normalizeRoleForAccess(role) === effectiveRole)

  if (!allowed) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
