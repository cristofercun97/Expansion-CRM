import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  hasLegacyAcademyContent,
  syncLegacyAcademyContentToOwnedTeam,
} from '@/features/academy/services/academy-legacy-sync.service'

function logLegacySyncDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

type UseSyncLegacyAcademyToOwnedTeamResult = {
  isSyncing: boolean
  syncError: string
}

export function useSyncLegacyAcademyToOwnedTeam(): UseSyncLegacyAcademyToOwnedTeamResult {
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const shouldSync =
    initialized &&
    !authLoading &&
    Boolean(currentUser?.uid) &&
    appUser?.activationStatus === 'active' &&
    Boolean(appUser?.ownedTeamId)

  useEffect(() => {
    if (!shouldSync || !currentUser?.uid || !appUser?.ownedTeamId) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const needsSync = await hasLegacyAcademyContent(currentUser.uid)

        if (!needsSync || cancelled) {
          return
        }

        setIsSyncing(true)
        setSyncError('')

        const result = await syncLegacyAcademyContentToOwnedTeam(
          currentUser.uid,
          appUser.ownedTeamId!,
        )

        if (import.meta.env.DEV && !cancelled && result.materialsUpdated > 0) {
          console.info(
            `[Academia] Sincronizados ${result.materialsUpdated} material(es) legacy con teamId ${appUser.ownedTeamId}`,
          )
        }
      } catch (error) {
        logLegacySyncDevError('[Academia] Error al sincronizar materiales legacy', error)

        if (!cancelled) {
          setSyncError(
            'No pudimos sincronizar tus materiales. Intenta refrescar o contacta soporte.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [appUser?.ownedTeamId, currentUser?.uid, shouldSync])

  return {
    isSyncing,
    syncError,
  }
}
