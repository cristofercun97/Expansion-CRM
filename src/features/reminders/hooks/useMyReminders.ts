import { useCallback, useEffect, useMemo, useState } from 'react'
import { remindersService } from '@/features/reminders/services/reminders.service'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'

type UseMyRemindersResult = {
  reminders: TeamReminder[]
  unreadCount: number
  loading: boolean
  error: string
  markingId: string | null
  markAsRead: (reminderId: string) => Promise<void>
  reload: () => void
}

export function useMyReminders(uid: string | null | undefined): UseMyRemindersResult {
  const [reminders, setReminders] = useState<TeamReminder[]>([])
  const [loading, setLoading] = useState(Boolean(uid))
  const [error, setError] = useState('')
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!uid) {
      setReminders([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false

    setLoading(true)
    setError('')

    remindersService
      .getMyReminders(uid)
      .then((result) => {
        if (!cancelled) {
          setReminders(result)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setReminders([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No pudimos cargar tus recordatorios.',
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
  }, [reloadToken, uid])

  const unreadCount = useMemo(
    () => reminders.filter((reminder) => reminder.status === 'unread').length,
    [reminders],
  )

  const markAsRead = useCallback(
    async (reminderId: string) => {
      if (!uid) {
        return
      }

      setMarkingId(reminderId)
      setError('')

      try {
        await remindersService.markReminderAsRead(reminderId, uid)
        setReminders((current) =>
          current.map((reminder) =>
            reminder.id === reminderId
              ? { ...reminder, status: 'read' as const, readAt: reminder.readAt }
              : reminder,
          ),
        )
      } catch (markError) {
        setError(
          markError instanceof Error
            ? markError.message
            : 'No pudimos marcar el recordatorio como leído.',
        )
      } finally {
        setMarkingId(null)
      }
    },
    [uid],
  )

  return {
    reminders,
    unreadCount,
    loading,
    error,
    markingId,
    markAsRead,
    reload,
  }
}
