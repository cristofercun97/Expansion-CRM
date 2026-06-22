import type { Timestamp } from 'firebase/firestore'

export type ReferralRewardStatus =
  | 'pending'
  | 'approved'
  | 'payable'
  | 'requested'
  | 'paid'
  | 'cancelled'

export type ReferralRewardSource = 'group_activation'

export type ReferralRewardLevel = 1 | 2 | 3

export type ReferralRewardMetadata = {
  activatedOwnedTeamId?: string
  activatedHomeTeamId?: string
  referralPath?: string[]
}

export type ReferralReward = {
  rewardId: string
  activationRequestId: string
  activatedUserUid: string
  activatedUserName?: string
  activatedUserEmail?: string
  beneficiaryUid: string
  beneficiaryName?: string
  beneficiaryEmail?: string
  level: ReferralRewardLevel
  amount: number
  currency: 'EUR'
  source: ReferralRewardSource
  status: ReferralRewardStatus
  reason?: string
  payoutRequestId?: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  approvedAt?: Timestamp | null
  payableAt?: Timestamp | null
  requestedAt?: Timestamp | null
  paidAt?: Timestamp | null
  cancelledAt?: Timestamp | null
  metadata?: ReferralRewardMetadata
}

export type ReferralRewardChainEntry = {
  level: ReferralRewardLevel
  beneficiaryUid: string
}

export type ReferralRewardCreationResult = {
  activationRequestId: string
  activatedUserUid: string
  chainLength: number
  rewardsCreated: number
  rewardsSkipped: number
  rewardIds: string[]
  warnings: string[]
}

export type CreateReferralRewardsForActivationParams = {
  activationRequestId: string
  activatedUserUid: string
  activatedUserName?: string
  activatedUserEmail?: string
  amount: number
  currency: string
  homeTeamId: string
  ownedTeamId: string | null
  requestRawData?: Record<string, unknown>
}
