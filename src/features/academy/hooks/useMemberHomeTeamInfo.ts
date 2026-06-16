import { useEffect, useState } from 'react'
import type { Team } from '@/features/team/types/team.types'
import { teamService } from '@/features/team/services/team.service'

type UseMemberHomeTeamInfoResult = {
  team: Team | null
  leaderName: string
  loading: boolean
  error: string
}

export function useMemberHomeTeamInfo(memberTeamId: string | null): UseMemberHomeTeamInfoResult {
  const [team, setTeam] = useState<Team | null>(null)
  const [leaderName, setLeaderName] = useState('')
  const [loading, setLoading] = useState(Boolean(memberTeamId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!memberTeamId) {
      setTeam(null)
      setLeaderName('')
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    void (async () => {
      try {
        const loadedTeam = await teamService.getTeamById(memberTeamId)

        if (cancelled) {
          return
        }

        if (!loadedTeam) {
          setTeam(null)
          setLeaderName('')
          setError('No encontramos la información de tu grupo.')
          return
        }

        setTeam(loadedTeam)

        const displayName = await teamService.getTeamLeaderDisplayName(
          loadedTeam.ownerUid,
          loadedTeam.name.trim() || 'Líder del grupo',
        )

        if (!cancelled) {
          setLeaderName(displayName)
        }
      } catch {
        if (!cancelled) {
          setTeam(null)
          setLeaderName('')
          setError('No pudimos cargar la información de tu grupo.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [memberTeamId])

  return {
    team,
    leaderName,
    loading,
    error,
  }
}
