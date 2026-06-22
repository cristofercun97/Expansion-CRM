import type { ReactNode } from 'react'
import { MemberModuleBlockedPage } from '@/features/access/components/MemberModuleBlockedPage'
import { AcademyProgressBlockedPage } from '@/features/academy/components/AcademyProgressBlockedPage'
import { useAuth } from '@/features/auth/hooks/useAuth'

type AcademyProgressRouteProps = {
  children: ReactNode
}

function AcademyProgressLoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <p className="text-sm font-medium text-hero-text/70">Cargando progreso...</p>
    </div>
  )
}

export function AcademyProgressRoute({ children }: AcademyProgressRouteProps) {
  const { appUser, initialized, loading } = useAuth()

  if (!initialized || loading) {
    return <AcademyProgressLoadingScreen />
  }

  if (appUser?.role === 'admin') {
    return children
  }

  const hasMemberContext = Boolean(appUser?.homeTeamId?.trim())
  const hasLeaderContext =
    appUser?.activationStatus === 'active' && Boolean(appUser?.ownedTeamId?.trim())

  if (!hasMemberContext && !hasLeaderContext) {
    return <AcademyProgressBlockedPage />
  }

  if (hasLeaderContext && appUser?.activationStatus !== 'active' && !hasMemberContext) {
    return <MemberModuleBlockedPage />
  }

  return children
}
