import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { academyProgressService } from '@/features/academy/services/academy-progress.service'
import type { AcademyProgressData } from '@/features/academy/types/academy-progress.types'
import { buildAcademyProgressSummary } from '@/features/academy/utils/academyProgressUtils'

type UseAcademyProgressResult = {
  data: AcademyProgressData | null
  loading: boolean
  error: string
}

export function useAcademyProgress(teamId: string | null): UseAcademyProgressResult {
  const { appUser } = useAuth()
  const [data, setData] = useState<AcademyProgressData | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId))
  const [error, setError] = useState('')

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

    academyProgressService
      .loadAcademyProgressData(teamId)
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
              : 'No pudimos cargar el progreso académico.',
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
  }, [appUser?.uid, teamId])

  return { data, loading, error }
}

export function useAcademyProgressSummary(data: AcademyProgressData | null) {
  return useMemo(() => {
    if (!data) {
      return null
    }

    return buildAcademyProgressSummary(
      data.members,
      data.attempts,
      data.materials,
      data.engagements,
    )
  }, [data])
}
