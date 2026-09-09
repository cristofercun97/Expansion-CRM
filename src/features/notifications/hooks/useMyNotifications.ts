import { useCallback, useEffect, useState } from 'react'
import { notificationsService } from '@/features/notifications/services/notifications.service'
import type { AppNotification } from '@/features/notifications/types/notification.types'

export function useMyNotifications(uid: string | null | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const normalizedUid = uid?.trim() || ''

  const refresh = useCallback(async () => {
    if (!normalizedUid) {
      setNotifications([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = await notificationsService.listMyNotifications(normalizedUid)
      setNotifications(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar notificaciones.')
    } finally {
      setLoading(false)
    }
  }, [normalizedUid])

  useEffect(() => {
    if (!normalizedUid) {
      return
    }

    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const items = await notificationsService.listMyNotifications(normalizedUid)
        if (!cancelled) setNotifications(items)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No pudimos cargar notificaciones.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [normalizedUid])

  const unreadCount = notifications.filter((item) => !item.read).length

  async function markRead(notificationId: string) {
    await notificationsService.markAsRead(notificationId)
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    )
  }

  return {
    notifications: normalizedUid ? notifications : [],
    unreadCount: normalizedUid ? unreadCount : 0,
    loading,
    error,
    refresh,
    markRead,
  }
}
