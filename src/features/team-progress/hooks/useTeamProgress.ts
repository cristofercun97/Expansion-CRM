import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { teamProgressService } from '@/features/team-progress/services/team-progress.service'
import type { TeamProgressData } from '@/features/team-progress/types/team-progress.types'
import { buildTeamProgressSummary } from '@/features/team-progress/utils/teamProgressUtils'

type UseTeamProgressResult = {
  data: TeamProgressData | null
  loading: boolean
  error: string
  reload: () => void
}

export function useTeamProgress(teamId: string | null): UseTeamProgressResult {
  const { appUser } = useAuth()
  const [data, setData] = useState<TeamProgressData | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId))
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!teamId) {
      setData(null)
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    setLoading(true)
    setError('')

    teamProgressService
      .loadTeamProgressData(teamId)
      .then((result) => {
        if (!cancelled) {
          setData(result)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setData(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar el progreso de tu equipo.',
          )
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
  }, [appUser?.uid, reloadToken, teamId])

  return { data, loading, error, reload }
}

export function useTeamProgressSummary(data: TeamProgressData | null) {
  return useMemo(() => {
    if (!data) {
      return null
    }

    return buildTeamProgressSummary(
      data.members,
      data.materials,
      data.attempts,
      data.engagements,
      data.tasks,
      data.taskProgress,
      data.reminders,
      data.memberContacts,
    )
  }, [data])
}
