import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  NotificationsContext,
  type NotificationsContextValue,
} from '@/features/notifications/context/notificationsContext'
import { notificationsService } from '@/features/notifications/services/notifications.service'
import type { AppNotification } from '@/features/notifications/types/notification.types'
import {
  countUnreadPublicBookings,
  formatAgendaBookingBadge,
} from '@/features/notifications/utils/bookingNotificationBadge'

export function NotificationsProvider({
  uid,
  children,
}: {
  uid: string | null | undefined
  children: ReactNode
}) {
  const normalizedUid = uid?.trim() || ''
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(Boolean(normalizedUid))
  const [error, setError] = useState<string | null>(null)
  const [listenToken, setListenToken] = useState(0)

  useEffect(() => {
    if (!normalizedUid) {
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
    })

    const unsubscribe = notificationsService.subscribeMyNotifications(
      normalizedUid,
      (items) => {
        if (cancelled) return
        setNotifications(items)
        setLoading(false)
      },
      (err) => {
        if (cancelled) return
        setError(err.message || 'No pudimos cargar notificaciones.')
        setLoading(false)
      },
    )
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [normalizedUid, listenToken])

  const markRead = useCallback(async (notificationId: string) => {
    await notificationsService.markAsRead(notificationId)
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    )
  }, [])

  const refresh = useCallback(() => {
    setListenToken((token) => token + 1)
  }, [])

  const value = useMemo<NotificationsContextValue>(() => {
    if (!normalizedUid) {
      return {
        notifications: [],
        unreadCount: 0,
        unreadPublicBookingCount: 0,
        agendaBookingBadge: '',
        loading: false,
        error: null,
        markRead,
        refresh,
      }
    }
    const unreadPublicBookingCount = countUnreadPublicBookings(notifications)
    return {
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      unreadPublicBookingCount,
      agendaBookingBadge: formatAgendaBookingBadge(unreadPublicBookingCount),
      loading,
      error,
      markRead,
      refresh,
    }
  }, [normalizedUid, notifications, loading, error, markRead, refresh])

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}
