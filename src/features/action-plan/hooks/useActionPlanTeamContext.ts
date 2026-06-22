import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  resolveActionPlanTeamContext,
  type ActionPlanTeamContext,
} from '@/features/action-plan/utils/actionPlanTeamAccess'
import { teamService } from '@/features/team/services/team.service'

type UseActionPlanTeamContextResult = {
  teamContext: ActionPlanTeamContext
  resolvedHomeTeamId: string | null
  resolvingTeams: boolean
}

export function useActionPlanTeamContext(): UseActionPlanTeamContextResult {
  const { appUser, currentUser, initialized, loading: authLoading } = useAuth()
  const [resolvedHomeTeamId, setResolvedHomeTeamId] = useState<string | null>(null)
  const [resolvingTeams, setResolvingTeams] = useState(true)

  useEffect(() => {
    if (!initialized || authLoading) {
      return
    }

    if (!currentUser?.uid || !appUser) {
      setResolvedHomeTeamId(null)
      setResolvingTeams(false)
      return
    }

    let cancelled = false
    setResolvingTeams(true)

    void teamService
      .resolveHomeTeamIdForAcademy(
        currentUser.uid,
        appUser.homeTeamId,
        appUser.ownedTeamId,
      )
      .then((homeTeamId) => {
        if (!cancelled) {
          setResolvedHomeTeamId(homeTeamId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedHomeTeamId(appUser.homeTeamId ?? null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingTeams(false)
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
  ])

  const teamContext = useMemo(
    () => resolveActionPlanTeamContext(appUser, resolvedHomeTeamId),
    [appUser, resolvedHomeTeamId],
  )

  return {
    teamContext,
    resolvedHomeTeamId,
    resolvingTeams,
  }
}
