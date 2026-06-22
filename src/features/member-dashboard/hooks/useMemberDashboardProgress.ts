import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { memberDashboardService } from '@/features/member-dashboard/services/member-dashboard.service'
import type { MemberDashboardProgress } from '@/features/member-dashboard/types/member-dashboard.types'
import {
  applyReminderReadToProgress,
  buildMemberDashboardProgress,
  resolveMemberDashboardTeamId,
} from '@/features/member-dashboard/utils/memberDashboardUtils'
import { remindersService } from '@/features/reminders/services/reminders.service'

type UseMemberDashboardProgressResult = {
  teamId: string | null
  progress: MemberDashboardProgress | null
  loading: boolean
  error: string
  markingReminderId: string | null
  markReminderAsRead: (reminderId: string) => Promise<void>
  reload: () => void
}

export function useMemberDashboardProgress(): UseMemberDashboardProgressResult {
  const { appUser } = useAuth()
  const teamId = resolveMemberDashboardTeamId(appUser)
  const memberUid = appUser?.uid ?? null

  const [progress, setProgress] = useState<MemberDashboardProgress | null>(null)
  const [loading, setLoading] = useState(Boolean(teamId && memberUid))
  const [error, setError] = useState('')
  const [markingReminderId, setMarkingReminderId] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!teamId || !memberUid) {
      setProgress(null)
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    setLoading(true)
    setError('')

    memberDashboardService
      .loadMemberDashboardData(teamId, memberUid)
      .then((data) => {
        if (!cancelled) {
          setProgress(buildMemberDashboardProgress(data))
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setProgress(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar tu avance. Inténtalo de nuevo.',
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
  }, [memberUid, reloadToken, teamId])

  const markReminderAsRead = useCallback(
    async (reminderId: string) => {
      if (!memberUid || !progress) {
        return
      }

      setMarkingReminderId(reminderId)
      setError('')

      try {
        await remindersService.markReminderAsRead(reminderId, memberUid)
        setProgress((current) =>
          current ? applyReminderReadToProgress(current, reminderId) : current,
        )
      } catch (markError) {
        setError(
          markError instanceof Error
            ? markError.message
            : 'No pudimos marcar el recordatorio como leído.',
        )
      } finally {
        setMarkingReminderId(null)
      }
    },
    [memberUid, progress],
  )

  return {
    teamId,
    progress,
    loading,
    error,
    markingReminderId,
    markReminderAsRead,
    reload,
  }
}
