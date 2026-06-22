import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import type { TeamSalesGoal, TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
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
  loadDebugContext?: SalesGoalLoadDebugContext
}

type UseTeamSalesGoalResult = {
  goal: TeamSalesGoal | null
  reports: TeamSalesReport[]
  pendingReports: TeamSalesReport[]
  validatedAmount: number
  progress: ReturnType<typeof buildSalesGoalProgress> | null
  loading: boolean
  error: string
  reload: () => Promise<void>
}

export function useTeamSalesGoal({
  teamId,
  viewerUid: _viewerUid = null,
  isLeader = false,
  enabled = true,
  periodTypeRequested = 'monthly',
  loadDebugContext,
}: UseTeamSalesGoalOptions): UseTeamSalesGoalResult {
  const [goal, setGoal] = useState<TeamSalesGoal | null>(null)
  const [reports, setReports] = useState<TeamSalesReport[]>([])
  const [loading, setLoading] = useState(Boolean(enabled && teamId?.trim()))
  const [error, setError] = useState('')

  const loadDebugContextRef = useRef(loadDebugContext)
  loadDebugContextRef.current = loadDebugContext

  const performLoad = useCallback(async (isActive: () => boolean = () => true) => {
    const normalizedTeamId = teamId?.trim()

    if (!enabled || !normalizedTeamId) {
      if (!isActive()) {
        return
      }

      setGoal(null)
      setReports([])
      setLoading(false)
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
      activeGoal = await salesGoalService.getActiveGoalForTeam(normalizedTeamId)

      if (!isActive()) {
        return
      }

      setGoal(activeGoal)

      if (isLeader) {
        try {
          const teamReports = await salesGoalService.getReportsForTeam(normalizedTeamId, {
            goalId: activeGoal?.id,
            leaderView: true,
          })

          if (!isActive()) {
            return
          }

          setReports(teamReports)
        } catch (reportsError) {
          if (import.meta.env.DEV) {
            console.warn('[SalesGoal] leader reports load failed', reportsError)
          }

          if (!isActive()) {
            return
          }

          setReports([])
        }
      } else {
        const memberUid = _viewerUid?.trim()

        if (memberUid) {
          try {
            const memberReports = await salesGoalService.getReportsForTeam(normalizedTeamId, {
              goalId: activeGoal?.id,
              memberUid,
            })

            if (!isActive()) {
              return
            }

            setReports(memberReports)
          } catch (reportsError) {
            if (import.meta.env.DEV) {
              console.warn('[SalesGoal] member reports load failed', reportsError)
            }

            if (!isActive()) {
              return
            }

            setReports([])
          }
        } else {
          setReports([])
        }
      }
    } catch (goalError) {
      logSalesGoalLoadError(goalError, debugContext)

      if (!isActive()) {
        return
      }

      setGoal(null)
      setReports([])
      setError('No se pudo cargar el objetivo de ventas.')
    } finally {
      if (isActive()) {
        setLoading(false)
      }
    }
  }, [enabled, isLeader, periodTypeRequested, teamId, _viewerUid])

  const performLoadRef = useRef(performLoad)
  performLoadRef.current = performLoad

  useEffect(() => {
    let active = true

    void performLoadRef.current(() => active)

    return () => {
      active = false
    }
  }, [enabled, isLeader, periodTypeRequested, teamId, _viewerUid])

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
    validatedAmount,
    progress,
    loading,
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
