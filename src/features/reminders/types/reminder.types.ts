import type { Timestamp } from 'firebase/firestore'

export type TeamReminderType = 'follow_up' | 'task' | 'academy' | 'recognition' | 'sales_report'

export type TeamReminderStatus = 'unread' | 'read'

export type TeamReminderSource = 'team_progress' | 'academy' | 'action_plan' | 'sales_goal'

export type TeamReminderPriority = 'high' | 'medium' | 'low'

export type TeamReminderRelatedContext = {
  source: TeamReminderSource
  priority?: TeamReminderPriority
  salesReportId?: string
  goalId?: string
  amount?: number
  currency?: string
  memberUid?: string
  ctaPath?: string
}

export type TeamReminder = {
  id: string
  teamId: string
  senderUid: string
  senderName: string
  recipientUid: string
  recipientName: string
  recipientEmail: string
  title: string
  message: string
  type: TeamReminderType
  status: TeamReminderStatus
  createdAt: Timestamp | null
  readAt: Timestamp | null
  relatedContext?: TeamReminderRelatedContext
}

export type CreateTeamReminderInput = {
  teamId: string
  senderUid: string
  senderName: string
  recipientUid: string
  recipientName: string
  recipientEmail: string
  title: string
  message: string
  type: TeamReminderType
  relatedContext?: TeamReminderRelatedContext
}
