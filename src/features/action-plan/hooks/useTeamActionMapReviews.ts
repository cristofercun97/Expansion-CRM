import { useCallback, useEffect, useState } from 'react'
import { teamActionMapReviewService } from '@/features/action-plan/services/team-action-map-review.service'
import type { TeamActionMapReview } from '@/features/action-plan/types/team-action-map-review.types'

type UseTeamActionMapReviewsResult = {
  reviews: TeamActionMapReview[]
  loading: boolean
  error: string
  reload: () => void
}

export function useTeamActionMapReviews(teamId: string | null): UseTeamActionMapReviewsResult {
  const [reviews, setReviews] = useState<TeamActionMapReview[]>([])
  const [loading, setLoading] = useState(Boolean(teamId?.trim()))
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()

    if (!normalizedTeamId) {
      setReviews([])
      setLoading(false)
      setError('')
      return
    }

    const teamIdToLoad = normalizedTeamId
    let cancelled = false

    async function loadReviews() {
      setLoading(true)
      setError('')

      try {
        const nextReviews = await teamActionMapReviewService.getTeamActionMapReviews(teamIdToLoad)

        if (!cancelled) {
          setReviews(nextReviews)
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error && loadError.message.includes('permission')
              ? 'No tienes permiso para ver las revisiones semanales de este grupo.'
              : 'No pudimos cargar las revisiones semanales. Intenta de nuevo en un momento.'

          setError(message)
          setReviews([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReviews()

    return () => {
      cancelled = true
    }
  }, [reloadToken, teamId])

  return { reviews, loading, error, reload }
}
