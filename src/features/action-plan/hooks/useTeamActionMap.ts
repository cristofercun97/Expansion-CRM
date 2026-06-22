import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { teamActionMapService } from '@/features/action-plan/services/team-action-map.service'
import type { TeamActionMap } from '@/features/action-plan/types/team-action-map.types'

type UseTeamActionMapResult = {
  map: TeamActionMap | null
  loading: boolean
  error: string
  reload: () => void
}

function resolveReadErrorMessage(error: unknown, emailVerified: boolean): string {
  const firebaseError = error as { code?: string; message?: string }

  if (firebaseError.code === 'permission-denied') {
    if (!emailVerified) {
      return 'No tienes permiso para ver el mapa. Verifica tu email, cierra sesión y vuelve a entrar.'
    }

    return 'No tienes permiso para ver el mapa de este grupo.'
  }

  return firebaseError.message ?? 'No pudimos cargar el mapa del grupo.'
}

export function useTeamActionMap(teamId: string | null): UseTeamActionMapResult {
  const { appUser, currentUser } = useAuth()
  const [map, setMap] = useState<TeamActionMap | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId?.trim()))
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const normalizedTeamId = teamId?.trim() ?? ''

    if (!normalizedTeamId) {
      setMap(null)
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    setLoading(true)
    setError('')

    const debugContext = {
      authUid: currentUser?.uid ?? null,
      authEmail: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? false,
      appUserUid: appUser?.uid ?? null,
      homeTeamId: appUser?.homeTeamId ?? null,
      ownedTeamId: appUser?.ownedTeamId ?? null,
      teamIdUsed: normalizedTeamId,
    }

    teamActionMapService
      .getTeamActionMap(normalizedTeamId, debugContext)
      .then((result) => {
        if (!cancelled) {
          setMap(result)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setMap(null)
          setError(resolveReadErrorMessage(loadError, debugContext.emailVerified))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [appUser?.homeTeamId, appUser?.ownedTeamId, appUser?.uid, currentUser?.email, currentUser?.emailVerified, currentUser?.uid, reloadToken, teamId])

  return { map, loading, error, reload }
}
