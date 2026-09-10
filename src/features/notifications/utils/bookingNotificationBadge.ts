/**
 * Pure helpers for public-booking notification badges / alerts.
 */

import type { AppNotification } from '@/features/notifications/types/notification.types'

export function isUnreadPublicBookingNotification(item: AppNotification): boolean {
  return item.type === 'public_booking_created' && item.read !== true
}

export function countUnreadPublicBookings(notifications: AppNotification[]): number {
  return notifications.filter(isUnreadPublicBookingNotification).length
}

/** Agenda sidebar badge label: empty string = hide. */
export function formatAgendaBookingBadge(count: number): string {
  if (count <= 0) return ''
  if (count > 99) return '99+'
  return String(count)
}

export function selectUnreadPublicBookings(
  notifications: AppNotification[],
  max = 3,
): { items: AppNotification[]; total: number; hasMore: boolean } {
  const unread = notifications.filter(isUnreadPublicBookingNotification)
  return {
    items: unread.slice(0, max),
    total: unread.length,
    hasMore: unread.length > max,
  }
}

/** Parse legacy `Lead · date · time` message when structured fields are missing. */
export function resolveBookingAlertFields(item: AppNotification): {
  leadName: string
  dateLabel: string
  timeLabel: string
  durationMinutes: number | null
  meetingId: string | null
  contactId: string | null
  source: string
} {
  const parts = (item.message || '').split('·').map((p) => p.trim())
  const leadName = item.leadName?.trim() || parts[0] || 'Lead'
  const dateLabel = item.dateLabel?.trim() || parts[1] || ''
  const timeLabel = item.timeLabel?.trim() || parts[2] || ''
  return {
    leadName,
    dateLabel,
    timeLabel,
    durationMinutes:
      typeof item.durationMinutes === 'number' && item.durationMinutes > 0
        ? item.durationMinutes
        : null,
    meetingId: item.meetingId,
    contactId: item.contactId,
    source: item.source?.trim() || 'Encuentro gratuito',
  }
}

export function contactActionUrl(contactId: string): string {
  return `/dashboard/contactos?contactId=${encodeURIComponent(contactId)}`
}

export function meetingActionUrl(meetingId: string): string {
  return `/dashboard/agenda?meetingId=${encodeURIComponent(meetingId)}`
}
