import { useContext } from 'react'
import {
  NotificationsContext,
  type NotificationsContextValue,
} from '@/features/notifications/context/notificationsContext'

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider')
  }
  return ctx
}

export function useOptionalNotificationsContext(): NotificationsContextValue | null {
  return useContext(NotificationsContext)
}
