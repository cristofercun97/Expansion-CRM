import { REFERRAL_REWARD_LEVELS } from '@/features/referrals/constants/referralProgram.constants'
import type {
  ReferralReward,
  ReferralRewardLevel,
  ReferralRewardStatus,
} from '@/features/referrals/types/referral-reward.types'
import type {
  ReferralRewardLevelStats,
  ReferralRewardsDashboardStats,
} from '@/features/referrals/types/referral-rewards-dashboard.types'

function sumAmount(
  rewards: ReferralReward[],
  predicate: (reward: ReferralReward) => boolean,
): number {
  return rewards.filter(predicate).reduce((sum, reward) => sum + reward.amount, 0)
}

function countByStatus(rewards: ReferralReward[], status: ReferralRewardStatus): number {
  return rewards.filter((reward) => reward.status === status).length
}

function buildLevelStats(rewards: ReferralReward[]): ReferralRewardLevelStats[] {
  return REFERRAL_REWARD_LEVELS.map((config) => {
    const levelRewards = rewards.filter((reward) => reward.level === config.level)
    const nonCancelled = levelRewards.filter((reward) => reward.status !== 'cancelled')
    const activePeople = new Set(
      nonCancelled.map((reward) => reward.activatedUserUid.trim()).filter(Boolean),
    )

    return {
      level: config.level as ReferralRewardLevel,
      label: config.label,
      rewardAmount: config.amount,
      activePeopleCount: activePeople.size,
      totalGeneratedAmount: sumAmount(nonCancelled, () => true),
      pendingAmount: sumAmount(levelRewards, (reward) => reward.status === 'pending'),
      approvedAmount: sumAmount(levelRewards, (reward) => reward.status === 'approved'),
      payableAmount: sumAmount(levelRewards, (reward) => reward.status === 'payable'),
      requestedAmount: sumAmount(levelRewards, (reward) => reward.status === 'requested'),
      paidAmount: sumAmount(levelRewards, (reward) => reward.status === 'paid'),
      cancelledAmount: sumAmount(levelRewards, (reward) => reward.status === 'cancelled'),
    }
  })
}

export function buildReferralRewardDashboardStats(
  rewards: ReferralReward[],
): ReferralRewardsDashboardStats {
  return {
    totalAmount: sumAmount(rewards, (reward) => reward.status !== 'cancelled'),
    pendingAmount: sumAmount(rewards, (reward) => reward.status === 'pending'),
    approvedAmount: sumAmount(rewards, (reward) => reward.status === 'approved'),
    payableAmount: sumAmount(rewards, (reward) => reward.status === 'payable'),
    requestedAmount: sumAmount(rewards, (reward) => reward.status === 'requested'),
    paidAmount: sumAmount(rewards, (reward) => reward.status === 'paid'),
    cancelledAmount: sumAmount(rewards, (reward) => reward.status === 'cancelled'),
    totalCount: rewards.filter((reward) => reward.status !== 'cancelled').length,
    pendingCount: countByStatus(rewards, 'pending'),
    approvedCount: countByStatus(rewards, 'approved'),
    payableCount: countByStatus(rewards, 'payable'),
    requestedCount: countByStatus(rewards, 'requested'),
    paidCount: countByStatus(rewards, 'paid'),
    cancelledCount: countByStatus(rewards, 'cancelled'),
    levelStats: buildLevelStats(rewards),
  }
}

export function formatReferralRewardAmount(amount: number, currency = 'EUR'): string {
  if (currency === 'EUR') {
    return `${amount} €`
  }

  return `${amount} ${currency}`
}

export function formatReferralRewardDate(
  timestamp: ReferralReward['createdAt'],
): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function shortenActivationRequestId(value: string): string {
  const trimmed = value.trim()

  if (trimmed.length <= 10) {
    return trimmed
  }

  return `${trimmed.slice(0, 8)}…`
}

export function resolveActivatedUserLabel(reward: ReferralReward): string {
  const name = reward.activatedUserName?.trim()

  if (name) {
    return name
  }

  return 'Activación confirmada'
}
