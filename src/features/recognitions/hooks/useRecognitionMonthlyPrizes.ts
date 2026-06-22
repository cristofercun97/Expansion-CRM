import { useCallback, useEffect, useState } from 'react'
import { recognitionMonthlyPrizesService } from '@/features/recognitions/services/recognition-monthly-prizes.service'
import type {
  RecognitionMonthlyPrizes,
  UpsertRecognitionMonthlyPrizesInput,
} from '@/features/recognitions/types/recognition-monthly-prizes.types'

type UseRecognitionMonthlyPrizesOptions = {
  enabled?: boolean
}

type UseRecognitionMonthlyPrizesResult = {
  prizes: RecognitionMonthlyPrizes | null
  loading: boolean
  saving: boolean
  error: string
  reload: () => Promise<void>
  savePrizes: (input: UpsertRecognitionMonthlyPrizesInput) => Promise<void>
}

export function useRecognitionMonthlyPrizes(
  teamId: string | null,
  options: UseRecognitionMonthlyPrizesOptions = {},
): UseRecognitionMonthlyPrizesResult {
  const { enabled = true } = options
  const [prizes, setPrizes] = useState<RecognitionMonthlyPrizes | null>(null)
  const [loading, setLoading] = useState(Boolean(enabled && teamId?.trim()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const normalizedTeamId = teamId?.trim()

    if (!enabled || !normalizedTeamId) {
      setPrizes(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const nextPrizes = await recognitionMonthlyPrizesService.getByTeamId(normalizedTeamId)
      setPrizes(nextPrizes)
    } catch {
      setPrizes(null)
      setError('No se pudieron cargar los premios mensuales.')
    } finally {
      setLoading(false)
    }
  }, [enabled, teamId])

  useEffect(() => {
    void reload()
  }, [reload])

  const savePrizes = useCallback(
    async (input: UpsertRecognitionMonthlyPrizesInput) => {
      setSaving(true)
      setError('')

      try {
        await recognitionMonthlyPrizesService.upsert(input)
        await reload()
      } catch {
        setError('No se pudieron guardar los premios mensuales.')
        throw new Error('No se pudieron guardar los premios mensuales.')
      } finally {
        setSaving(false)
      }
    },
    [reload],
  )

  return {
    prizes,
    loading,
    saving,
    error,
    reload,
    savePrizes,
  }
}
