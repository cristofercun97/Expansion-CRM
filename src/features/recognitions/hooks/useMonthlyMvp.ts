import { useCallback, useEffect, useState } from 'react'
import { monthlyMvpService } from '@/features/recognitions/services/monthly-mvp.service'
import type { MonthlyMvpResult } from '@/features/recognitions/types/monthly-mvp.types'

type UseMonthlyMvpResult = {
  mvp: MonthlyMvpResult | null
  loading: boolean
  error: string
  reload: () => void
}

export function useMonthlyMvp(teamId: string | null): UseMonthlyMvpResult {
  const [mvp, setMvp] = useState<MonthlyMvpResult | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId?.trim()))
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()

    if (!normalizedTeamId) {
      setMvp(null)
      setLoading(false)
      setError('')
      return
    }

    const teamIdToLoad = normalizedTeamId
    let cancelled = false

    async function loadMonthlyMvp() {
      setLoading(true)
      setError('')

      try {
        const nextMvp = await monthlyMvpService.getMonthlyMvpForTeam(teamIdToLoad)

        if (!cancelled) {
          setMvp(nextMvp)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('[useMonthlyMvp] Failed to load monthly MVP', loadError)
          }

          setMvp(null)
          setError('No pudimos cargar el MVP del mes. Inténtalo de nuevo en un momento.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadMonthlyMvp()

    return () => {
      cancelled = true
    }
  }, [reloadToken, teamId])

  return { mvp, loading, error, reload }
}
