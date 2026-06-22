import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { teamService } from '@/features/team/services/team.service'
import {
  resolveDualTeamAvailability,
  resolveTeamContextMode,
  resolveTeamIdForMode,
  type DualTeamAvailability,
  type TeamContextMode,
} from '@/features/team/utils/teamContextUtils'

type UseTeamContextSelectionOptions = {
  resolvedHomeTeamId?: string | null
  resolvingHomeTeam?: boolean
}

type UseTeamContextSelectionResult = {
  availability: DualTeamAvailability
  mode: TeamContextMode | null
  teamId: string | null
  showSelector: boolean
  canSwitch: boolean
  resolving: boolean
  selectContext: (mode: TeamContextMode) => void
  clearContext: () => void
}

export function useTeamContextSelection(
  options: UseTeamContextSelectionOptions = {},
): UseTeamContextSelectionResult {
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [internalHomeTeamId, setInternalHomeTeamId] = useState<string | null>(null)
  const [resolvingInternalHomeTeam, setResolvingInternalHomeTeam] = useState(true)

  const usesExternalHomeTeam = options.resolvedHomeTeamId !== undefined
  const resolvedHomeTeamId = usesExternalHomeTeam
    ? options.resolvedHomeTeamId ?? null
    : internalHomeTeamId
  const resolvingHomeTeam = usesExternalHomeTeam
    ? Boolean(options.resolvingHomeTeam)
    : resolvingInternalHomeTeam

  useEffect(() => {
    if (usesExternalHomeTeam) {
      return
    }

    if (!initialized || authLoading) {
      return
    }

    if (!currentUser?.uid || !appUser) {
      setInternalHomeTeamId(null)
      setResolvingInternalHomeTeam(false)
      return
    }

    let cancelled = false
    setResolvingInternalHomeTeam(true)

    void teamService
      .resolveHomeTeamIdForAcademy(currentUser.uid, appUser.homeTeamId, appUser.ownedTeamId)
      .then((homeTeamId) => {
        if (!cancelled) {
          setInternalHomeTeamId(homeTeamId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInternalHomeTeamId(appUser.homeTeamId ?? null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingInternalHomeTeam(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    appUser,
    appUser?.homeTeamId,
    appUser?.ownedTeamId,
    authLoading,
    currentUser?.uid,
    initialized,
    usesExternalHomeTeam,
  ])

  const availability = useMemo(
    () => resolveDualTeamAvailability(appUser, resolvedHomeTeamId),
    [appUser, resolvedHomeTeamId],
  )

  const contextParam = searchParams.get('context')
  const mode = useMemo(
    () => resolveTeamContextMode(contextParam, availability),
    [availability, contextParam],
  )

  const showSelector = availability.needsSelector && mode === null
  const canSwitch = availability.needsSelector && mode !== null
  const teamId = mode ? resolveTeamIdForMode(mode, availability) : null

  const selectContext = useCallback(
    (nextMode: TeamContextMode) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          params.set('context', nextMode)
          return params
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearContext = useCallback(() => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        params.delete('context')
        return params
      },
      { replace: true },
    )
  }, [setSearchParams])

  return {
    availability,
    mode,
    teamId,
    showSelector,
    canSwitch,
    resolving: !initialized || authLoading || resolvingHomeTeam,
    selectContext,
    clearContext,
  }
}
