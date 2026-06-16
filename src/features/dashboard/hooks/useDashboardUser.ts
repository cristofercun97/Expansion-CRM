import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { DashboardUserIdentity } from '@/features/dashboard/types/dashboard.types'
import { logDashboardDevError } from '@/features/dashboard/utils/logDashboardDevError'
import { resolveDashboardUser } from '@/features/dashboard/utils/resolveDashboardUser'
import { usersService } from '@/services/users.service'
import type { AppUser } from '@/types'

type UseDashboardUserResult = {
  user: DashboardUserIdentity
  appUser: AppUser | null
  isProfileLoading: boolean
}

export function useDashboardUser(): UseDashboardUserResult {
  const { appUser, currentUser, loading, initialized } = useAuth()
  const [profileFallback, setProfileFallback] = useState<AppUser | null>(null)

  const resolvedAppUser = appUser ?? profileFallback
  const isProfileLoading = !initialized || loading

  const user = useMemo(
    () => resolveDashboardUser(resolvedAppUser, currentUser),
    [resolvedAppUser, currentUser],
  )

  useEffect(() => {
    if (appUser || !currentUser?.uid || loading) {
      return
    }

    let cancelled = false

    usersService
      .getUserProfile(currentUser.uid)
      .then((profile) => {
        if (!cancelled && profile) {
          setProfileFallback(profile)
        }
      })
      .catch((error) => {
        logDashboardDevError('[Dashboard] No se pudo leer users/{uid}. Usando Auth.', error)
      })

    return () => {
      cancelled = true
    }
  }, [appUser, currentUser?.uid, loading])

  return {
    user,
    appUser: resolvedAppUser,
    isProfileLoading,
  }
}
