import type { Timestamp } from 'firebase/firestore'
import type { ActionTask, ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyTest } from '@/features/academy/types/academy-test.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import type { TeamMember } from '@/features/team/types/team.types'
import type { TeamSalesGoal, TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'

export type TeamMemberContactInfo = {
  phone: string | null
  photoURL: string | null
}

export type TeamMemberOverallStatus =
  | 'not_started'
  | 'in_follow_up'
  | 'good_progress'
  | 'excellent'

export type TeamMemberPriority = 'high' | 'medium' | 'low'

export type TeamMemberProgressRow = {
  memberUid: string
  memberName: string
  memberEmail: string
  memberPhone: string | null
  memberPhotoURL: string | null
  reviewedMaterialsCount: number
  totalMaterials: number
  testsCompleted: number
  averageScore: number | null
  completedTasksCount: number
  totalTasks: number
  planCompliancePercent: number
  overallStatus: TeamMemberOverallStatus
  priority: TeamMemberPriority
  lastActivityAt: Timestamp | null
  lastReminderAt: Timestamp | null
  lastReminderStatus: 'unread' | 'read' | null
  remindersCount: number
  unreadRemindersCount: number
}

export type TeamProgressSummary = {
  totalMembers: number
  membersInGoodProgress: number
  needsFollowUp: number
  generalCompliancePercent: number
  members: TeamMemberProgressRow[]
}

export type TeamMemberModuleProgressItem = {
  materialId: string
  title: string
  reviewed: boolean
  lastOpenedAt: Timestamp | null
}

export type TeamMemberTaskProgressItem = {
  taskId: string
  title: string
  status: ActionTaskProgress['status'] | 'pending'
  updatedAt: Timestamp | null
  priority: ActionTask['priority']
  dueDate: string | null
  areaTitle: string | null
}

export type TeamProgressData = {
  teamId: string
  members: TeamMember[]
  materials: AcademyMaterial[]
  tests: AcademyTest[]
  attempts: AcademyTestAttempt[]
  engagements: AcademyMaterialEngagement[]
  tasks: ActionTask[]
  taskProgress: ActionTaskProgress[]
  reminders: TeamReminder[]
  remindersLoadError: string
  salesGoal: TeamSalesGoal | null
  salesReports: TeamSalesReport[]
  salesLoadError: string
  memberContacts: Record<string, TeamMemberContactInfo>
}
