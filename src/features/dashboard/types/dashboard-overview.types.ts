import type { Timestamp } from 'firebase/firestore'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'
import type { UserActivationStatus, UserRole } from '@/types'

export type DashboardOverviewSectionState = 'ready' | 'empty' | 'error'

export type DashboardCommercialGoalStatus =
  | 'no_goal'
  | 'on_track'
  | 'needs_attention'
  | 'at_risk'
  | 'completed'

export type DashboardAttentionPriority = 'low' | 'medium' | 'high'

export type DashboardAttentionItemType =
  | 'pending_sales'
  | 'pending_payouts'
  | 'inactive_members'
  | 'hot_contacts'
  | 'pending_tasks'
  | 'unread_reminders'

export type DashboardRecentActivityType =
  | 'sale_reported'
  | 'sale_validated'
  | 'reward_generated'
  | 'payout_requested'
  | 'member_joined'
  | 'contact_created'
  | 'academy_completed'
  | 'task_completed'
  | 'reminder_received'

export type DashboardUserProfileOverview = {
  uid: string
  displayName: string
  email: string
  role: UserRole
  activationStatus?: UserActivationStatus
  homeTeamId: string | null
  ownedTeamId: string | null
  referralUpline: string[]
  hasActiveOwnedOrganization: boolean
}

export type DashboardTeamOverview = {
  teamId: string
  teamName: string
  ownerUid: string
  totalMembers: number | null
  myRank: number | null
  myPoints: number | null
  status: string | null
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardOwnedTeamOverview = {
  teamId: string
  teamName: string
  directMembers: number
  activeMembers: number
  directLeaders: number
  normalMembers: number
  validatedSalesAmount: number
  generatedRewardsAmount: number
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardCommercialGoalOverview = {
  goalAmount: number | null
  validatedAmount: number
  pendingAmount: number
  remainingAmount: number | null
  progressPercent: number | null
  periodKey: string | null
  periodLabel: string | null
  daysRemaining: number | null
  status: DashboardCommercialGoalStatus
  emptyMessage: string | null
  teamId: string | null
  state: DashboardOverviewSectionState
  errorMessage: string | null
}

export type DashboardSalesReportSummary = {
  id: string
  memberName: string
  amount: number
  currency: string
  status: string
  reportedAt: Timestamp | null
}

export type DashboardSalesOverview = {
  validatedSalesCount: number
  validatedSalesAmount: number
  pendingSalesCount: number
  pendingSalesAmount: number
  rejectedSalesCount: number
  latestPendingSales: DashboardSalesReportSummary[]
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardRankingEntry = {
  rank: number
  memberUid: string
  memberName: string
  points: number
  activitySummary?: string | null
}

export type DashboardPointsBreakdown = {
  academyPoints: number
  taskPoints: number
  reminderPoints: number
  bonusPoints: number
  salesPoints: number
}

export type DashboardRankingSource =
  | 'published_weekly'
  | 'live_weekly'
  | 'monthly_aggregate'
  | 'empty'

export type DashboardRankingOverview = {
  weeklyTop3: DashboardRankingEntry[]
  monthlyTop5: DashboardRankingEntry[]
  currentUserRank: number | null
  currentUserPoints: number | null
  pointsBreakdown: DashboardPointsBreakdown | null
  weekLabel: string | null
  rankingSource: DashboardRankingSource
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardPrizesOverview = {
  mvpPrize: string | null
  secondPrize: string | null
  thirdPrize: string | null
  currentMvpCandidate: string | null
  prizePeriod: string | null
  isConfigured: boolean
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardRewardsOverview = {
  rewardsPayableAmount: number
  rewardsRequestedAmount: number
  rewardsPaidAmount: number
  rewardsCancelledAmount: number
  payoutPendingCount: number
  latestPayoutRequest: ReferralPayoutRequest | null
  state: DashboardOverviewSectionState
  emptyMessage: string | null
  errorMessage: string | null
}

export type DashboardAttentionItem = {
  id: string
  type: DashboardAttentionItemType
  title: string
  description: string
  count: number
  priority: DashboardAttentionPriority
  href: string
  isVisible: boolean
}

export type DashboardRecentActivityItem = {
  id: string
  type: DashboardRecentActivityType
  title: string
  description: string
  createdAt: Timestamp | null
  actorName: string | null
  href: string | null
}

export type DashboardQuickLink = {
  label: string
  href: string
  description: string
  isEnabled: boolean
  reasonIfDisabled?: string
}

export type DashboardWeeklyProgressOverview = {
  isAvailable: boolean
  value: number
  goal: number
  message: string
  emptyMessage: string | null
}

export type DashboardSuggestionOverview = {
  title: string
  message: string
  actionLabel: string
  actionTo: string
  isAvailable: boolean
}

export type DashboardViewScope = 'home_team' | 'owned_team'

export type DashboardScopedOverview = {
  teamId: string | null
  teamName: string | null
  commercialGoal: DashboardCommercialGoalOverview
  sales: DashboardSalesOverview
  ranking: DashboardRankingOverview
  prizes: DashboardPrizesOverview
  attentionItems: DashboardAttentionItem[]
  recentActivity: DashboardRecentActivityItem[]
}

export type DashboardOverviewData = {
  userProfile: DashboardUserProfileOverview
  homeTeam: DashboardTeamOverview | null
  ownedTeam: DashboardOwnedTeamOverview | null
  scopes: {
    home_team: DashboardScopedOverview | null
    owned_team: DashboardScopedOverview | null
  }
  commercialGoal: DashboardCommercialGoalOverview
  sales: DashboardSalesOverview
  ranking: DashboardRankingOverview
  prizes: DashboardPrizesOverview
  rewards: DashboardRewardsOverview
  attentionItems: DashboardAttentionItem[]
  recentActivity: DashboardRecentActivityItem[]
  quickLinks: DashboardQuickLink[]
  kpis: DashboardKpi[]
  weeklyProgress: DashboardWeeklyProgressOverview
  suggestion: DashboardSuggestionOverview
}
