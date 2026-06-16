import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth.service'
import { teamService } from '@/features/team/services/team.service'

function logEnsureOwnedTeamDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

type UseEnsureOwnedTeamForActiveUserResult = {
  isEnsuring: boolean
  ensureError: string
}

export function useEnsureOwnedTeamForActiveUser(): UseEnsureOwnedTeamForActiveUserResult {
  const { appUser, currentUser, initialized, loading: authLoading, refreshUser } = useAuth()
  const [isEnsuring, setIsEnsuring] = useState(false)
  const [ensureError, setEnsureError] = useState('')
  const ensureAttemptedRef = useRef(false)

  const needsEnsure =
    initialized &&
    !authLoading &&
    Boolean(currentUser?.uid) &&
    appUser?.role !== 'admin' &&
    appUser?.activationStatus === 'active' &&
    !appUser?.ownedTeamId

  useEffect(() => {
    if (!needsEnsure || ensureAttemptedRef.current || !currentUser?.uid) {
      return
    }

    let cancelled = false
    ensureAttemptedRef.current = true

    const displayName =
      appUser?.displayName?.trim() ||
      currentUser.displayName?.trim() ||
      currentUser.email?.trim() ||
      'Usuario'

    setIsEnsuring(true)
    setEnsureError('')

    void (async () => {
      try {
        if (currentUser) {
          await authService.ensureFreshAuthToken(currentUser)
        }

        await teamService.ensureActiveUserOwnedTeam(currentUser.uid, displayName)

        if (!cancelled) {
          await refreshUser()
        }
      } catch (error) {
        logEnsureOwnedTeamDevError('[Academia] Error al asegurar grupo propio', error)

        if (!cancelled) {
          ensureAttemptedRef.current = false
          setEnsureError(
            'No pudimos preparar tu grupo. Intenta refrescar o contacta soporte.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsEnsuring(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    appUser?.displayName,
    currentUser,
    needsEnsure,
    refreshUser,
  ])

  return {
    isEnsuring: needsEnsure ? isEnsuring : false,
    ensureError,
  }
}
