import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  recognitionRankingService,
  type RecognitionRankingLoadContext,
} from '@/features/recognitions/services/recognition-ranking.service'
import type {
  WeeklyRankingEntry,
  WeeklyRecognitionRanking,
} from '@/features/recognitions/types/recognition-ranking.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import {
  logRecognitionRankingDebug,
  logRecognitionRankingError,
} from '@/features/recognitions/utils/recognitionRankingDebug'
import { getCurrentRecognitionWeekPeriod } from '@/features/recognitions/utils/recognitionScoring'

export type WeeklyRecognitionRankingSource = 'live' | 'snapshot' | 'none'

type UseWeeklyRecognitionRankingOptions = {
  viewRole: RecognitionsViewRole
  memberUid: string | null
}

type UseWeeklyRecognitionRankingResult = {
  ranking: WeeklyRecognitionRanking | null
  personalEntry: WeeklyRankingEntry | null
  rankingSource: WeeklyRecognitionRankingSource
  hasPublishedSnapshot: boolean
  periodLabel: string
  loading: boolean
  error: string
  publishing: boolean
  publishError: string
  publishSuccess: string
  reload: () => void
  publishRanking: () => Promise<void>
}

export function useWeeklyRecognitionRanking(
  teamId: string | null,
  { viewRole, memberUid }: UseWeeklyRecognitionRankingOptions,
): UseWeeklyRecognitionRankingResult {
  const { currentUser, appUser } = useAuth()
  const [ranking, setRanking] = useState<WeeklyRecognitionRanking | null>(null)
  const [personalEntry, setPersonalEntry] = useState<WeeklyRankingEntry | null>(null)
  const [rankingSource, setRankingSource] = useState<WeeklyRecognitionRankingSource>('none')
  const [hasPublishedSnapshot, setHasPublishedSnapshot] = useState(false)
  const [loading, setLoading] = useState(Boolean(teamId?.trim()))
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishSuccess, setPublishSuccess] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const periodLabel = getCurrentRecognitionWeekPeriod().label

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  const publishRanking = useCallback(async () => {
    const normalizedTeamId = teamId?.trim()
    const normalizedMemberUid = memberUid?.trim()

    if (!normalizedTeamId || !normalizedMemberUid || viewRole !== 'leader') {
      return
    }

    const loadContext: RecognitionRankingLoadContext = {
      authUid: normalizedMemberUid,
      viewRole: 'leader',
    }

    setPublishing(true)
    setPublishError('')
    setPublishSuccess('')

    try {
      await recognitionRankingService.publishWeeklyRecognitionRanking(
        normalizedTeamId,
        normalizedMemberUid,
        loadContext,
      )
      setHasPublishedSnapshot(true)
      setPublishSuccess('Ranking semanal publicado para tu equipo.')
      reload()
    } catch (publishFailure) {
      if (import.meta.env.DEV) {
        logRecognitionRankingError({
          error: publishFailure,
          authUid: normalizedMemberUid,
          viewRole: 'leader',
          teamId: normalizedTeamId,
          period: getCurrentRecognitionWeekPeriod(),
          failedStep: 'leader.publishSnapshot',
        })
      }

      setPublishError('No pudimos publicar el ranking semanal. Inténtalo de nuevo.')
    } finally {
      setPublishing(false)
    }
  }, [memberUid, reload, teamId, viewRole])

  useEffect(() => {
    const normalizedTeamId = teamId?.trim()
    const normalizedMemberUid = memberUid?.trim()
    const ownedTeamId = appUser?.ownedTeamId?.trim() || null
    const homeTeamId = appUser?.homeTeamId?.trim() || null
    const period = getCurrentRecognitionWeekPeriod()

    if (!normalizedTeamId) {
      setRanking(null)
      setPersonalEntry(null)
      setRankingSource('none')
      setHasPublishedSnapshot(false)
      setLoading(false)
      setError('')
      return
    }

    logRecognitionRankingDebug({
      authUid: currentUser?.uid,
      authEmail: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      appUserUid: appUser?.uid,
      viewRole,
      teamId: normalizedTeamId,
      ownedTeamId,
      homeTeamId,
      period,
    })

    const teamIdToLoad = normalizedTeamId
    const loadContext: RecognitionRankingLoadContext = {
      authUid: normalizedMemberUid ?? currentUser?.uid ?? null,
      viewRole,
    }
    let cancelled = false

    async function loadLeaderRanking() {
      const nextRanking = await recognitionRankingService.getWeeklyRecognitionRankingForLeader(
        teamIdToLoad,
        loadContext,
      )
      const publishedSnapshotExists =
        await recognitionRankingService.hasPublishedWeeklySnapshot(teamIdToLoad, loadContext)

      if (!cancelled) {
        setRanking(nextRanking)
        setPersonalEntry(null)
        setRankingSource('live')
        setHasPublishedSnapshot(publishedSnapshotExists)
        setError('')
      }
    }

    async function loadMemberRanking() {
      if (!normalizedMemberUid) {
        if (!cancelled) {
          setRanking(null)
          setPersonalEntry(null)
          setRankingSource('none')
          setHasPublishedSnapshot(false)
          setError('')
        }
        return
      }

      const memberUidToLoad = normalizedMemberUid
      const [publishedRanking, nextPersonalEntry] = await Promise.all([
        recognitionRankingService.getPublishedWeeklyRecognitionRanking(teamIdToLoad, loadContext),
        recognitionRankingService.getMemberPersonalWeeklyEntry(teamIdToLoad, memberUidToLoad),
      ])

      if (!cancelled) {
        setRanking(publishedRanking)
        setPersonalEntry(nextPersonalEntry)
        setRankingSource(publishedRanking ? 'snapshot' : 'none')
        setHasPublishedSnapshot(Boolean(publishedRanking))
        setError('')
      }
    }

    async function loadRanking() {
      setLoading(true)
      setError('')
      setPublishSuccess('')

      try {
        if (viewRole === 'leader') {
          await loadLeaderRanking()
          return
        }

        if (viewRole === 'member') {
          await loadMemberRanking()
          return
        }

        if (!cancelled) {
          setRanking(null)
          setPersonalEntry(null)
          setRankingSource('none')
          setHasPublishedSnapshot(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            logRecognitionRankingError({
              error: loadError,
              authUid: normalizedMemberUid ?? currentUser?.uid ?? null,
              viewRole,
              teamId: teamIdToLoad,
              period,
              failedStep: viewRole === 'leader' ? 'leader.loadRanking' : 'member.loadRanking',
            })
          }

          if (viewRole === 'leader') {
            setRanking(null)
            setPersonalEntry(null)
            setRankingSource('none')
            setError('No pudimos calcular el ranking semanal. Inténtalo de nuevo en un momento.')
            return
          }

          setRanking(null)
          setPersonalEntry(null)
          setRankingSource('none')
          setHasPublishedSnapshot(false)
          setError('')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRanking()

    return () => {
      cancelled = true
    }
  }, [
    appUser?.homeTeamId,
    appUser?.ownedTeamId,
    appUser?.uid,
    currentUser?.email,
    currentUser?.emailVerified,
    currentUser?.uid,
    memberUid,
    reloadToken,
    teamId,
    viewRole,
  ])

  return {
    ranking,
    personalEntry,
    rankingSource,
    hasPublishedSnapshot,
    periodLabel,
    loading,
    error,
    publishing,
    publishError,
    publishSuccess,
    reload,
    publishRanking,
  }
}
