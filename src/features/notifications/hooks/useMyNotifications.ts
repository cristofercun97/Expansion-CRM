import { useOptionalNotificationsContext } from '@/features/notifications/hooks/useNotificationsContext'

/**
 * Shared notifications hook. Must be used under NotificationsProvider
 * (DashboardShell). Falls back to empty state outside provider.
 */
export function useMyNotifications(uid: string | null | undefined) {
  const ctx = useOptionalNotificationsContext()
  const normalizedUid = uid?.trim() || ''

  if (!ctx || !normalizedUid) {
    return {
      notifications: [] as AppNotificationEmpty,
      unreadCount: 0,
      unreadPublicBookingCount: 0,
      agendaBookingBadge: '',
      loading: false,
      error: null as string | null,
      refresh: () => undefined,
      markRead: async () => undefined,
    }
  }

  return {
    notifications: ctx.notifications,
    unreadCount: ctx.unreadCount,
    unreadPublicBookingCount: ctx.unreadPublicBookingCount,
    agendaBookingBadge: ctx.agendaBookingBadge,
    loading: ctx.loading,
    error: ctx.error,
    refresh: ctx.refresh,
    markRead: ctx.markRead,
  }
}

type AppNotificationEmpty = []
