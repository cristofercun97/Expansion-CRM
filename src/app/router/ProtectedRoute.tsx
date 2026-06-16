import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'

type ProtectedRouteProps = {
  children: ReactNode
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-warm px-6">
      <p className="text-sm font-medium text-text-soft">Cargando tu sesión...</p>
    </div>
  )
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, initialized, loading } = useAuth()

  if (!initialized || loading) {
    return <AuthLoadingScreen />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verificar-email" replace />
  }

  return children
}
