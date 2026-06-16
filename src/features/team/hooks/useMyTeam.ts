import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { authService } from '@/features/auth/services/auth.service'
import { teamService } from '@/features/team/services/team.service'
import type { Team } from '@/features/team/types/team.types'

function logTeamDevError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error)
  }
}

type UseMyTeamResult = {
  team: Team | null
  loading: boolean
  error: string
  refresh: () => Promise<void>
  updateTeamName: (name: string) => Promise<Team>
}

export function useMyTeam(): UseMyTeamResult {
  const { appUser, currentUser, initialized, loading: authLoading, refreshUser } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const uid = currentUser?.uid

  const loadTeam = useCallback(async () => {
    if (!uid) {
      setTeam(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const displayName =
      appUser?.displayName?.trim() ||
      currentUser?.displayName?.trim() ||
      currentUser?.email?.trim() ||
      'Usuario'

    try {
      if (currentUser) {
        await authService.ensureFreshAuthToken(currentUser)
      }

      let ownedTeamId = appUser?.ownedTeamId

      if (appUser?.activationStatus === 'active' && !ownedTeamId) {
        const ensured = await teamService.ensureActiveUserOwnedTeam(uid, displayName)
        ownedTeamId = ensured.teamId
        await refreshUser()
      }

      const result = await teamService.getUserTeam(uid, displayName, {
        homeTeamId: appUser?.homeTeamId,
        ownedTeamId,
        role: appUser?.role,
        activationStatus: appUser?.activationStatus,
      })

      if (
        import.meta.env.DEV &&
        appUser?.activationStatus === 'active' &&
        ownedTeamId &&
        result &&
        result.id !== ownedTeamId
      ) {
        console.warn('[Mi grupo] inviteCode no corresponde a ownedTeamId', {
          teamId: result.id,
          ownedTeamId,
        })
      }

      setTeam(result)
    } catch (loadError) {
      logTeamDevError('[Mi grupo] Error al cargar o crear grupo', loadError)
      setTeam(null)
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No pudimos preparar tu grupo. Intenta nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [appUser?.activationStatus, appUser?.displayName, appUser?.homeTeamId, appUser?.ownedTeamId, appUser?.role, currentUser, refreshUser, uid])

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    void loadTeam()
  }, [authLoading, initialized, loadTeam])

  const updateTeamName = useCallback(
    async (name: string) => {
      if (!uid || !team) {
        throw new Error('No hay un grupo disponible para actualizar.')
      }

      const updatedTeam = await teamService.updateTeamName(team.id, uid, name)
      setTeam(updatedTeam)
      return updatedTeam
    },
    [team, uid],
  )

  return {
    team,
    loading,
    error,
    refresh: loadTeam,
    updateTeamName,
  }
}
