import type { Timestamp } from 'firebase/firestore'

export type AppNotificationType =
  | 'meeting_reminder'
  | 'meeting_invitation'
  | 'meeting_rescheduled'
  | 'meeting_cancelled'
  | 'meeting_result_pending'
  | 'public_booking_created'

export type AppNotification = {
  id: string
  recipientUid: string
  type: AppNotificationType
  title: string
  message: string
  meetingId: string | null
  contactId: string | null
  leadName: string | null
  dateLabel: string | null
  timeLabel: string | null
  durationMinutes: number | null
  source: string | null
  actionUrl: string
  actionLabel: string
  read: boolean
  createdAt: Timestamp | null
  readAt: Timestamp | null
}
