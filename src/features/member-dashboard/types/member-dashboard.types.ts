import type { ActionTask, ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { TeamActionMapReview } from '@/features/action-plan/types/team-action-map-review.types'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { AcademyMaterial } from '@/features/academy/types/academy.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import type { AppUser } from '@/types'

export type MemberAcademySummary = {
  reviewedMaterialsCount: number
  totalMaterials: number
  testsCompleted: number
  averageScore: number | null
  nextPendingModuleTitle: string | null
}

export type MemberPlanSummary = {
  completedTasksCount: number
  totalTasks: number
  inProgressTasksCount: number
  pendingTasksCount: number
  nextPendingTaskTitle: string | null
  nextPendingTaskAreaTitle: string | null
}

export type MemberNextStepKind = 'reminders' | 'weekly_review' | 'academy' | 'plan' | 'complete'

export type MemberNextStep = {
  kind: MemberNextStepKind
  message: string
  ctaLabel: string
  ctaTo: string
}

export type MemberDashboardProgress = {
  teamId: string
  academy: MemberAcademySummary
  plan: MemberPlanSummary
  reminders: TeamReminder[]
  unreadRemindersCount: number
  lastReminderTitle: string | null
  latestWeeklyReview: TeamActionMapReview | null
  nextStep: MemberNextStep
}

export type MemberDashboardRawData = {
  teamId: string
  materials: AcademyMaterial[]
  engagements: AcademyMaterialEngagement[]
  attempts: AcademyTestAttempt[]
  tasks: ActionTask[]
  taskProgress: ActionTaskProgress[]
  reminders: TeamReminder[]
  latestWeeklyReview: TeamActionMapReview | null
}

export type ResolveMemberDashboardTeamIdInput = Pick<AppUser, 'homeTeamId' | 'ownedTeamId'>
