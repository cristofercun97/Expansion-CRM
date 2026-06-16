import type { ReactNode } from 'react'
import { MemberModuleBlockedPage } from '@/features/access/components/MemberModuleBlockedPage'
import { canAccessOwnerModules } from '@/features/access/utils/canAccessOwnerModules'
import { useAuth } from '@/features/auth/hooks/useAuth'

type OwnerModuleRouteProps = {
  children: ReactNode
}

function OwnerModuleLoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm font-medium text-hero-text/70">Cargando módulo...</p>
    </div>
  )
}

export function OwnerModuleRoute({ children }: OwnerModuleRouteProps) {
  const { appUser, initialized, loading } = useAuth()

  if (!initialized || loading) {
    return <OwnerModuleLoadingScreen />
  }

  if (!canAccessOwnerModules(appUser)) {
    return <MemberModuleBlockedPage />
  }

  return children
}
