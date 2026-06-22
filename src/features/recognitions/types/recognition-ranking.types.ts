import type { TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { TeamMember } from '@/features/team/types/team.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'

export type RecognitionWeekPeriod = {
  weekStart: Date
  weekEnd: Date
  weekStartIso: string
  weekEndIso: string
  label: string
  startMs: number
  endMs: number
}

export type WeeklyScoreBreakdown = {
  academyPoints: number
  taskPoints: number
  reminderPoints: number
  bonusPoints: number
  salesPoints: number
  validatedSalesAmount: number
  validatedSalesCount: number
  salesBonusPoints: number
  total: number
}

export type MemberWeeklyActivityStats = {
  modulesReviewed: number
  testsTaken: number
  tasksCompleted: number
  tasksInProgress: number
  remindersRead: number
  validatedSalesCount: number
}

export type WeeklyRankingEntry = {
  rank: number
  memberUid: string
  memberName: string
  breakdown: WeeklyScoreBreakdown
  stats: MemberWeeklyActivityStats
  activitySummary: string
}

export type WeeklyRecognitionRanking = {
  teamId: string
  period: RecognitionWeekPeriod
  entries: WeeklyRankingEntry[]
  podium: WeeklyRankingEntry[]
  membersWithPointsCount: number
  hasActivity: boolean
  loadWarnings: string[]
}

export type RecognitionRankingRawData = {
  teamId: string
  members: TeamMember[]
  engagements: AcademyMaterialEngagement[]
  attempts: AcademyTestAttempt[]
  taskProgress: ActionTaskProgress[]
  reminders: TeamReminder[]
  salesReports: TeamSalesReport[]
  loadWarnings: string[]
}
