import type { Timestamp } from 'firebase/firestore'

export type AppNotificationType =
  | 'meeting_reminder'
  | 'meeting_invitation'
  | 'meeting_rescheduled'
  | 'meeting_cancelled'
  | 'meeting_result_pending'

export type AppNotification = {
  id: string
  recipientUid: string
  type: AppNotificationType
  title: string
  message: string
  meetingId: string | null
  actionUrl: string
  actionLabel: string
  read: boolean
  createdAt: Timestamp | null
  readAt: Timestamp | null
}
