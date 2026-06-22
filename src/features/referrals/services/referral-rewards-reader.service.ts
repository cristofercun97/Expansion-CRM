import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import type {
  ReferralReward,
  ReferralRewardLevel,
  ReferralRewardSource,
  ReferralRewardStatus,
} from '@/features/referrals/types/referral-reward.types'
import { buildReferralRewardDashboardStats } from '@/features/referrals/utils/referralRewardDashboardUtils'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'
import type { Timestamp } from 'firebase/firestore'

const REFERRAL_REWARD_STATUSES: ReferralRewardStatus[] = [
  'pending',
  'approved',
  'payable',
  'requested',
  'paid',
  'cancelled',
]

function parseReferralRewardStatus(value: unknown): ReferralRewardStatus {
  if (typeof value === 'string' && REFERRAL_REWARD_STATUSES.includes(value as ReferralRewardStatus)) {
    return value as ReferralRewardStatus
  }

  return 'pending'
}

function parseReferralRewardLevel(value: unknown): ReferralRewardLevel {
  if (value === 1 || value === 2 || value === 3) {
    return value
  }

  return 1
}

function parseTimestamp(value: unknown): Timestamp | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value as Timestamp
  }

  return null
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function mapReferralRewardDocument(rewardId: string, data: DocumentData): ReferralReward {
  const source: ReferralRewardSource =
    data.source === 'group_activation' ? 'group_activation' : 'group_activation'

  return {
    rewardId,
    activationRequestId:
      typeof data.activationRequestId === 'string' ? data.activationRequestId : '',
    activatedUserUid: typeof data.activatedUserUid === 'string' ? data.activatedUserUid : '',
    activatedUserName: parseOptionalString(data.activatedUserName),
    activatedUserEmail: parseOptionalString(data.activatedUserEmail),
    beneficiaryUid: typeof data.beneficiaryUid === 'string' ? data.beneficiaryUid : '',
    beneficiaryName: parseOptionalString(data.beneficiaryName),
    beneficiaryEmail: parseOptionalString(data.beneficiaryEmail),
    level: parseReferralRewardLevel(data.level),
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: data.currency === 'EUR' ? 'EUR' : 'EUR',
    source,
    status: parseReferralRewardStatus(data.status),
    reason: parseOptionalString(data.reason),
    payoutRequestId: parseOptionalString(data.payoutRequestId),
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
    approvedAt: parseTimestamp(data.approvedAt) ?? undefined,
    payableAt: parseTimestamp(data.payableAt) ?? undefined,
    requestedAt: parseTimestamp(data.requestedAt) ?? undefined,
    paidAt: parseTimestamp(data.paidAt) ?? undefined,
    cancelledAt: parseTimestamp(data.cancelledAt) ?? undefined,
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as ReferralReward['metadata'])
        : undefined,
  }
}

function buildMyReferralRewardsQuery(userUid: string) {
  return query(
    collection(getFirebaseDb(), COLLECTIONS.referralRewards),
    where('beneficiaryUid', '==', userUid.trim()),
    orderBy('createdAt', 'desc'),
  )
}

export async function getMyReferralRewards(userUid: string): Promise<ReferralReward[]> {
  const normalizedUid = userUid.trim()

  if (!normalizedUid) {
    return []
  }

  const snapshot = await getDocs(buildMyReferralRewardsQuery(normalizedUid))

  return snapshot.docs.map((rewardDoc) =>
    mapReferralRewardDocument(rewardDoc.id, rewardDoc.data()),
  )
}

export function subscribeMyReferralRewards(
  userUid: string,
  onUpdate: (rewards: ReferralReward[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const normalizedUid = userUid.trim()

  if (!normalizedUid) {
    onUpdate([])
    return () => undefined
  }

  return onSnapshot(
    buildMyReferralRewardsQuery(normalizedUid),
    (snapshot) => {
      const rewards = snapshot.docs.map((rewardDoc) =>
        mapReferralRewardDocument(rewardDoc.id, rewardDoc.data()),
      )
      onUpdate(rewards)
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error('Error al cargar recompensas'))
    },
  )
}

export const referralRewardsReaderService = {
  getMyReferralRewards,
  subscribeMyReferralRewards,
  mapReferralRewardDocument,
  buildReferralRewardDashboardStats,
}
