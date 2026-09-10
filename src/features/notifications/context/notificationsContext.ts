import { createContext } from 'react'
import type { AppNotification } from '@/features/notifications/types/notification.types'

export type NotificationsContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  unreadPublicBookingCount: number
  agendaBookingBadge: string
  loading: boolean
  error: string | null
  markRead: (notificationId: string) => Promise<void>
  refresh: () => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)
