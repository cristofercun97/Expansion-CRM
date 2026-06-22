import type { Timestamp } from 'firebase/firestore'

export type SalesGoalPeriodType = 'weekly' | 'monthly'
export type SalesGoalCurrency = 'EUR' | 'USD'
export type SalesGoalStatus = 'active' | 'closed'
export type SalesReportStatus = 'reported' | 'validated' | 'rejected'

export type TeamSalesGoal = {
  id: string
  teamId: string
  ownerUid: string
  periodType: SalesGoalPeriodType
  periodKey: string
  periodLabel: string
  currency: SalesGoalCurrency
  targetAmount: number
  currentAmount: number
  description?: string | null
  status: SalesGoalStatus
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  /** Reserved for future recognition scoring integration */
  recognitionEligible?: boolean
}

export type TeamSalesReport = {
  id: string
  teamId: string
  goalId: string
  memberUid: string
  memberName: string
  amount: number
  currency: SalesGoalCurrency
  note?: string | null
  status: SalesReportStatus
  reportedAt: Timestamp | null
  validatedAt?: Timestamp | null
  validatedByUid?: string | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  /** Reserved for future recognition scoring integration */
  recognitionPointsPending?: boolean
}

export type UpsertTeamSalesGoalInput = {
  teamId: string
  ownerUid: string
  periodType: SalesGoalPeriodType
  targetAmount: number
  currency: SalesGoalCurrency
  description?: string | null
}

export type CreateTeamSalesReportInput = {
  teamId: string
  goalId: string
  memberUid: string
  memberName: string
  amount: number
  currency: SalesGoalCurrency
  note?: string | null
}

export type SalesMemberCommercialStatus =
  | 'no_activity'
  | 'in_motion'
  | 'good_progress'
  | 'high_impact'
  | 'needs_support'

export type SalesMemberCommercialSummary = {
  memberUid: string
  memberName: string
  memberEmail?: string
  reportedCount: number
  pendingCount: number
  validatedCount: number
  rejectedCount: number
  totalReportedAmount: number
  totalValidatedAmount: number
  totalValidatedCurrentMonth: number
  totalValidatedAllTime: number
  pendingAmount: number
  contributionPercentage: number
  lastReportedAt: Timestamp | null
  lastSaleAt: Timestamp | null
  needsSupport: boolean
  commercialStatus: SalesMemberCommercialStatus
}
