import { useEffect, useMemo, useState } from 'react'
import { monthlyMvpService } from '@/features/recognitions/services/monthly-mvp.service'
import { recognitionRankingService } from '@/features/recognitions/services/recognition-ranking.service'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import { teamRecognitionService } from '@/features/recognitions/services/team-recognition.service'
import type { MonthlyMvpResult } from '@/features/recognitions/types/monthly-mvp.types'
import type {
  PositiveFomoContext,
  RecognitionAchievement,
} from '@/features/recognitions/types/recognition-achievement.types'
import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type { TeamRecognition } from '@/features/recognitions/types/team-recognition.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import {
  buildPositiveFomoMessage,
  buildRecognitionAchievements,
} from '@/features/recognitions/utils/recognitionAchievements'

type UseRecentAchievementsFeedOptions = {
  teamId: string | null
  viewerUid: string | null
  viewRole: RecognitionsViewRole
}

type UseRecentAchievementsFeedResult = {
  achievements: RecognitionAchievement[]
  fomoMessage: string
  loading: boolean
  error: string
}

export function useRecentAchievementsFeed({
  teamId,
  viewerUid,
  viewRole,
}: UseRecentAchievementsFeedOptions): UseRecentAchievementsFeedResult {
  const [recognitions, setRecognitions] = useState<TeamRecognition[]>([])
  const [latestPublishedSnapshot, setLatestPublishedSnapshot] =
    useState<RecognitionWeeklySnapshot | null>(null)
  const [monthlyMvp, setMonthlyMvp] = useState<MonthlyMvpResult | null>(null)
  const [personalWeeklyPoints, setPersonalWeeklyPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId?.trim() && viewerUid?.trim()))
  const [error, setError] = useState('')

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()
    const normalizedViewerUid = viewerUid?.trim()

    if (!normalizedTeamId || !normalizedViewerUid || viewRole === 'none') {
      setRecognitions([])
      setLatestPublishedSnapshot(null)
      setMonthlyMvp(null)
      setPersonalWeeklyPoints(null)
      setLoading(false)
      setError('')
      return
    }

    const teamIdToLoad = normalizedTeamId
    const viewerUidToLoad = normalizedViewerUid
    let cancelled = false

    async function loadFeed() {
      setLoading(true)
      setError('')

      try {
        const [nextRecognitions, nextSnapshot, nextMonthlyMvp, nextPersonalEntry] =
          await Promise.all([
            teamRecognitionService.getTeamRecognitions(
              teamIdToLoad,
              viewerUidToLoad,
              viewRole,
            ),
            recognitionWeeklySnapshotService.getPublishedSnapshotByPeriod(teamIdToLoad, undefined, {
              teamId: teamIdToLoad,
              authUid: viewerUidToLoad,
              viewRole,
            }),
            monthlyMvpService.getMonthlyMvpForTeam(teamIdToLoad),
            viewRole === 'member'
              ? recognitionRankingService
                  .getMemberPersonalWeeklyEntry(teamIdToLoad, viewerUidToLoad)
                  .catch(() => null)
              : Promise.resolve(null),
          ])

        if (!cancelled) {
          setRecognitions(nextRecognitions)
          setLatestPublishedSnapshot(nextSnapshot)
          setMonthlyMvp(nextMonthlyMvp)
          setPersonalWeeklyPoints(nextPersonalEntry?.breakdown.total ?? null)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('[useRecentAchievementsFeed] Failed to load feed', loadError)
          }

          setRecognitions([])
          setLatestPublishedSnapshot(null)
          setMonthlyMvp(null)
          setPersonalWeeklyPoints(null)
          setError('No pudimos cargar los logros recientes.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadFeed()

    return () => {
      cancelled = true
    }
  }, [teamId, viewRole, viewerUid])

  const achievements = useMemo(
    () =>
      buildRecognitionAchievements({
        recognitions,
        latestPublishedSnapshot,
        monthlyMvp,
        personalWeeklyPoints,
        viewRole,
        currentMemberUid: viewerUid,
      }),
    [
      latestPublishedSnapshot,
      monthlyMvp,
      personalWeeklyPoints,
      recognitions,
      viewRole,
      viewerUid,
    ],
  )

  const fomoContext: PositiveFomoContext = useMemo(
    () => ({
      viewRole,
      hasPublishedRanking: Boolean(latestPublishedSnapshot),
      hasRecentRecognitions: recognitions.length > 0,
    }),
    [latestPublishedSnapshot, recognitions.length, viewRole],
  )

  const fomoMessage = useMemo(() => buildPositiveFomoMessage(fomoContext), [fomoContext])

  return {
    achievements,
    fomoMessage,
    loading,
    error,
  }
}
