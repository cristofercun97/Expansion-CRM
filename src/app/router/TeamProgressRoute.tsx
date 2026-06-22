import type { ReactNode } from 'react'
import { MemberModuleBlockedPage } from '@/features/access/components/MemberModuleBlockedPage'
import { TeamProgressBlockedPage } from '@/features/team-progress/components/TeamProgressBlockedPage'
import { useAuth } from '@/features/auth/hooks/useAuth'

type TeamProgressRouteProps = {
  children: ReactNode
}

function TeamProgressLoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm font-medium text-hero-text/70">Cargando progreso...</p>
    </div>
  )
}

export function TeamProgressRoute({ children }: TeamProgressRouteProps) {
  const { appUser, initialized, loading } = useAuth()

  if (!initialized || loading) {
    return <TeamProgressLoadingScreen />
  }

  if (appUser?.role === 'admin') {
    return children
  }

  if (appUser?.activationStatus !== 'active') {
    return <MemberModuleBlockedPage />
  }

  if (!appUser.ownedTeamId) {
    return <TeamProgressBlockedPage />
  }

  return children
}
