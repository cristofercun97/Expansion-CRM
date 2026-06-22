import type { ReferralRewardLevel } from '@/features/referrals/types/referral-reward.types'

export type ReferralRewardLevelStats = {
  level: ReferralRewardLevel
  label: string
  rewardAmount: number
  activePeopleCount: number
  totalGeneratedAmount: number
  pendingAmount: number
  approvedAmount: number
  payableAmount: number
  requestedAmount: number
  paidAmount: number
  cancelledAmount: number
}

export type ReferralRewardsDashboardStats = {
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
  payableAmount: number
  requestedAmount: number
  paidAmount: number
  cancelledAmount: number
  totalCount: number
  pendingCount: number
  approvedCount: number
  payableCount: number
  requestedCount: number
  paidCount: number
  cancelledCount: number
  levelStats: ReferralRewardLevelStats[]
}
