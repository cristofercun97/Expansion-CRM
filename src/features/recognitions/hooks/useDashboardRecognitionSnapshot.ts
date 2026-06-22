import { useEffect, useMemo, useState } from 'react'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'

type UseDashboardRecognitionSnapshotOptions = {
  teamId: string | null
  viewerUid: string | null
  viewRole: RecognitionsViewRole
}

export type DashboardPodiumEntry = {
  rank: number
  memberName: string
  points: number
}

type UseDashboardRecognitionSnapshotResult = {
  snapshot: RecognitionWeeklySnapshot | null
  topThree: DashboardPodiumEntry[]
  hasPublishedSnapshot: boolean
  firstPlaceHasCommercialImpact: boolean
  loading: boolean
}

function getFirstPlaceCommercialImpact(snapshot: RecognitionWeeklySnapshot | null): boolean {
  if (!snapshot) {
    return false
  }

  const firstFromRanking = snapshot.ranking.find((entry) => entry.position === 1)
  if ((firstFromRanking?.breakdownPublic.salesPoints ?? 0) > 0) {
    return true
  }

  const firstFromPodium = snapshot.podium.find((entry) => entry.position === 1)
  if (!firstFromPodium) {
    return false
  }

  const matchingRankingEntry = snapshot.ranking.find(
    (entry) => entry.memberUid === firstFromPodium.memberUid,
  )

  return (matchingRankingEntry?.breakdownPublic.salesPoints ?? 0) > 0
}

function getTopThreeFromSnapshot(
  snapshot: RecognitionWeeklySnapshot | null,
): DashboardPodiumEntry[] {
  if (!snapshot) {
    return []
  }

  const source =
    snapshot.podium.length > 0
      ? snapshot.podium
      : snapshot.ranking.map((entry) => ({
          memberUid: entry.memberUid,
          memberName: entry.memberName,
          score: entry.score,
          position: entry.position,
          summary: entry.summary,
        }))

  return source
    .filter((entry) => entry.score > 0)
    .sort((left, right) => left.position - right.position)
    .slice(0, 3)
    .map((entry) => ({
      rank: entry.position,
      memberName: entry.memberName,
      points: entry.score,
    }))
}

export function useDashboardRecognitionSnapshot({
  teamId,
  viewerUid,
  viewRole,
}: UseDashboardRecognitionSnapshotOptions): UseDashboardRecognitionSnapshotResult {
  const [snapshot, setSnapshot] = useState<RecognitionWeeklySnapshot | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId?.trim() && viewerUid?.trim()))

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()
    const normalizedViewerUid = viewerUid?.trim()

    if (!normalizedTeamId || !normalizedViewerUid || viewRole === 'none') {
      setSnapshot(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadSnapshot() {
      setLoading(true)

      try {
        const nextSnapshot = await recognitionWeeklySnapshotService.getPublishedSnapshotByPeriod(
          normalizedTeamId!,
          undefined,
          {
            teamId: normalizedTeamId!,
            authUid: normalizedViewerUid,
            viewRole,
          },
        )

        if (!cancelled) {
          setSnapshot(nextSnapshot)
        }
      } catch {
        if (!cancelled) {
          setSnapshot(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadSnapshot()

    return () => {
      cancelled = true
    }
  }, [teamId, viewRole, viewerUid])

  const topThree = useMemo(() => getTopThreeFromSnapshot(snapshot), [snapshot])
  const firstPlaceHasCommercialImpact = useMemo(
    () => getFirstPlaceCommercialImpact(snapshot),
    [snapshot],
  )

  return {
    snapshot,
    topThree,
    hasPublishedSnapshot: Boolean(snapshot),
    firstPlaceHasCommercialImpact,
    loading,
  }
}
