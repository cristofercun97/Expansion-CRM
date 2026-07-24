import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import type {
  TeamSalesGoal,
  TeamSalesGoalHistory,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  logSalesGoalLoadDebug,
  logSalesGoalLoadError,
  type SalesGoalLoadDebugContext,
} from '@/features/sales-goals/utils/salesGoalDebug'
import {
  buildSalesGoalProgress,
  buildSalesGoalDocId,
  buildSalesPeriodKey,
  sumValidatedSalesReports,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { COLLECTIONS } from '@/lib/firebase'

type UseTeamSalesGoalOptions = {
  teamId: string | null
  viewerUid?: string | null
  isLeader?: boolean
  enabled?: boolean
  periodTypeRequested?: 'weekly' | 'monthly'
  leaderDisplayName?: string | null
  loadDebugContext?: SalesGoalLoadDebugContext
}

type UseTeamSalesGoalResult = {
  goal: TeamSalesGoal | null
  reports: TeamSalesReport[]
  pendingReports: TeamSalesReport[]
  history: TeamSalesGoalHistory[]
  validatedAmount: number
  progress: ReturnType<typeof buildSalesGoalProgress> | null
  loading: boolean
  historyLoading: boolean
  error: string
  reload: () => Promise<void>
}

export function useTeamSalesGoal({
  teamId,
  viewerUid: _viewerUid = null,
  isLeader = false,
  enabled = true,
  periodTypeRequested = 'monthly',
  leaderDisplayName = null,
  loadDebugContext,
}: UseTeamSalesGoalOptions): UseTeamSalesGoalResult {
  const [goal, setGoal] = useState<TeamSalesGoal | null>(null)
  const [reports, setReports] = useState<TeamSalesReport[]>([])
  const [history, setHistory] = useState<TeamSalesGoalHistory[]>([])
  const [loading, setLoading] = useState(Boolean(enabled && teamId?.trim()))
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDebugContextRef = useRef(loadDebugContext)
  loadDebugContextRef.current = loadDebugContext

  const performLoad = useCallback(
    async (isActive: () => boolean = () => true) => {
      const normalizedTeamId = teamId?.trim()

      if (!enabled || !normalizedTeamId) {
        if (!isActive()) {
          return
        }

        setGoal(null)
        setReports([])
        setHistory([])
        setLoading(false)
        setHistoryLoading(false)
        return
      }

      const { periodKey } = buildSalesPeriodKey(periodTypeRequested)
      const expectedGoalId = buildSalesGoalDocId(normalizedTeamId, periodKey)
      const expectedPath = `${COLLECTIONS.teamSalesGoals}/${expectedGoalId}`
      const debugContext: SalesGoalLoadDebugContext = {
        ...loadDebugContextRef.current,
        effectiveTeamId: normalizedTeamId,
        periodTypeRequested,
        expectedGoalId,
        expectedPath,
      }

      logSalesGoalLoadDebug(debugContext)

      if (!isActive()) {
        return
      }

      setLoading(true)
      setError('')

      let activeGoal: TeamSalesGoal | null = null

      try {
        const ownerUid = _viewerUid?.trim()

        if (isLeader && ownerUid) {
          await salesGoalService
            .ensureExpiredGoalsRollover(normalizedTeamId, {
              ownerUid,
              senderName: leaderDisplayName?.trim() || 'Líder del equipo',
            })
            .catch((rolloverError) => {
              if (import.meta.env.DEV) {
                console.warn('[SalesGoal] period rollover failed', rolloverError)
              }
            })
        }

        activeGoal = await salesGoalService.getActiveGoalForTeam(normalizedTeamId)

        if (!isActive()) {
          return
        }

        setGoal(activeGoal)

        if (isLeader) {
          setHistoryLoading(true)

          try {
            const [teamReports, teamHistory] = await Promise.all([
              salesGoalService.getReportsForTeam(normalizedTeamId, {
                goalId: activeGoal?.id,
                leaderView: true,
              }),
              salesGoalService.getHistoryForTeam(normalizedTeamId, 12, {
                ownerUid,
                persist: true,
                senderName: leaderDisplayName?.trim() || 'Líder del equipo',
              }),
            ])

            if (!isActive()) {
              return
            }

            setReports(teamReports)
            setHistory(teamHistory)
          } catch (reportsError) {
            if (import.meta.env.DEV) {
              console.warn('[SalesGoal] leader reports/history load failed', reportsError)
            }

            if (!isActive()) {
              return
            }

            setReports([])
            setHistory([])
          } finally {
            if (isActive()) {
              setHistoryLoading(false)
            }
          }
        } else {
          const memberUid = _viewerUid?.trim()

          if (memberUid) {
            try {
              const [memberReports, teamHistory] = await Promise.all([
                salesGoalService.getReportsForTeam(normalizedTeamId, {
                  goalId: activeGoal?.id,
                  memberUid,
                }),
                salesGoalService
                  .getHistoryForTeam(normalizedTeamId, 12, {
                    ownerUid: null,
                    persist: false,
                  })
                  .catch(() => []),
              ])

              if (!isActive()) {
                return
              }

              setReports(memberReports)
              setHistory(teamHistory)
            } catch (reportsError) {
              if (import.meta.env.DEV) {
                console.warn('[SalesGoal] member reports load failed', reportsError)
              }

              if (!isActive()) {
                return
              }

              setReports([])
              setHistory([])
            }
          } else {
            setReports([])
            setHistory([])
          }
        }
      } catch (goalError) {
        logSalesGoalLoadError(goalError, debugContext)

        if (!isActive()) {
          return
        }

        setGoal(null)
        setReports([])
        setHistory([])
        setError('No se pudo cargar el objetivo de ventas.')
      } finally {
        if (isActive()) {
          setLoading(false)
        }
      }
    },
    [enabled, isLeader, leaderDisplayName, periodTypeRequested, teamId, _viewerUid],
  )

  const performLoadRef = useRef(performLoad)
  performLoadRef.current = performLoad

  useEffect(() => {
    let active = true

    void performLoadRef.current(() => active)

    return () => {
      active = false
    }
  }, [enabled, isLeader, leaderDisplayName, periodTypeRequested, teamId, _viewerUid])

  const reload = useCallback(async () => {
    await performLoadRef.current(() => true)
  }, [])

  const validatedAmount = useMemo(() => {
    if (!goal) {
      return 0
    }

    if (isLeader) {
      const fromReports = sumValidatedSalesReports(reports)
      return Math.max(fromReports, goal.currentAmount)
    }

    return Math.max(goal.currentAmount, 0)
  }, [goal, isLeader, reports])

  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === 'reported'),
    [reports],
  )
  const progress = useMemo(
    () => (goal ? buildSalesGoalProgress(goal, validatedAmount) : null),
    [goal, validatedAmount],
  )

  return {
    goal,
    reports,
    pendingReports,
    history,
    validatedAmount,
    progress,
    loading,
    historyLoading,
    error,
    reload,
  }
}

export function useTeamSalesGoalActions(reload: () => Promise<void>) {
  const [saving, setSaving] = useState(false)

  const wrapAction = useCallback(
    async (action: () => Promise<void>) => {
      setSaving(true)

      try {
        await action()
      } finally {
        setSaving(false)
      }

      try {
        await reload()
      } catch (reloadError) {
        if (import.meta.env.DEV) {
          console.warn('[SalesGoal] reload after action failed', reloadError)
        }
      }
    },
    [reload],
  )

  return { saving, wrapAction }
}
