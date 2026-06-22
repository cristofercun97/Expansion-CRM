import { useCallback, useEffect, useState } from 'react'
import { teamRecognitionService } from '@/features/recognitions/services/team-recognition.service'
import type { TeamRecognition } from '@/features/recognitions/types/team-recognition.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'

type UseTeamRecognitionsOptions = {
  teamId: string | null
  viewerUid: string | null
  viewRole: RecognitionsViewRole
}

type UseTeamRecognitionsResult = {
  recognitions: TeamRecognition[]
  loading: boolean
  error: string
  reload: () => void
}

export function useTeamRecognitions({
  teamId,
  viewerUid,
  viewRole,
}: UseTeamRecognitionsOptions): UseTeamRecognitionsResult {
  const [recognitions, setRecognitions] = useState<TeamRecognition[]>([])
  const [loading, setLoading] = useState(Boolean(teamId?.trim() && viewerUid?.trim()))
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()
    const normalizedViewerUid = viewerUid?.trim()

    if (!normalizedTeamId || !normalizedViewerUid || viewRole === 'none') {
      setRecognitions([])
      setLoading(false)
      setError('')
      return
    }

    const teamIdToLoad = normalizedTeamId
    const viewerUidToLoad = normalizedViewerUid
    let cancelled = false

    async function loadRecognitions() {
      setLoading(true)
      setError('')

      try {
        const nextRecognitions = await teamRecognitionService.getTeamRecognitions(
          teamIdToLoad,
          viewerUidToLoad,
          viewRole,
        )

        if (!cancelled) {
          setRecognitions(nextRecognitions)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('[useTeamRecognitions] Failed to load recognitions', loadError)
          }

          setRecognitions([])
          setError('No pudimos cargar los reconocimientos. Inténtalo de nuevo.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRecognitions()

    return () => {
      cancelled = true
    }
  }, [reloadToken, teamId, viewRole, viewerUid])

  return { recognitions, loading, error, reload }
}
