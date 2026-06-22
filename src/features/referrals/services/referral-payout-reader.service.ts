import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import type {
  ReferralPayoutPaymentMethodSnapshot,
  ReferralPayoutPaymentMethodType,
  ReferralPayoutRequest,
  ReferralPayoutRequestStatus,
} from '@/features/referrals/types/referral-payout-request.types'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

const PAYOUT_STATUSES: ReferralPayoutRequestStatus[] = [
  'pending',
  'approved',
  'paid',
  'rejected',
  'cancelled',
]

const PAYMENT_TYPES: ReferralPayoutPaymentMethodType[] = [
  'bank',
  'crypto',
  'paypal',
  'other',
]

function parseTimestamp(value: unknown): Timestamp | null {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value as Timestamp
  }

  return null
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function parsePayoutStatus(value: unknown): ReferralPayoutRequestStatus {
  if (typeof value === 'string' && PAYOUT_STATUSES.includes(value as ReferralPayoutRequestStatus)) {
    return value as ReferralPayoutRequestStatus
  }

  return 'pending'
}

function parsePaymentMethodSnapshot(value: unknown): ReferralPayoutPaymentMethodSnapshot {
  if (!value || typeof value !== 'object') {
    return {type: 'other', label: '—', details: '—'}
  }

  const snapshot = value as Record<string, unknown>
  const type =
    typeof snapshot.type === 'string' &&
    PAYMENT_TYPES.includes(snapshot.type as ReferralPayoutPaymentMethodType)
      ? (snapshot.type as ReferralPayoutPaymentMethodType)
      : 'other'

  return {
    type,
    label: typeof snapshot.label === 'string' ? snapshot.label : '—',
    details: typeof snapshot.details === 'string' ? snapshot.details : '—',
  }
}

export function mapReferralPayoutRequestDocument(
  requestId: string,
  data: DocumentData,
): ReferralPayoutRequest {
  const rewardIds = Array.isArray(data.rewardIds)
    ? data.rewardIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : []

  return {
    requestId,
    userUid: typeof data.userUid === 'string' ? data.userUid : '',
    userName: parseOptionalString(data.userName),
    userEmail: parseOptionalString(data.userEmail),
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: data.currency === 'EUR' ? 'EUR' : 'EUR',
    status: parsePayoutStatus(data.status),
    rewardIds,
    rewardCount: typeof data.rewardCount === 'number' ? data.rewardCount : rewardIds.length,
    paymentMethodSnapshot: parsePaymentMethodSnapshot(data.paymentMethodSnapshot),
    requestedAt: parseTimestamp(data.requestedAt),
    updatedAt: parseTimestamp(data.updatedAt),
    approvedAt: parseTimestamp(data.approvedAt) ?? undefined,
    approvedByUid: parseOptionalString(data.approvedByUid),
    paidAt: parseTimestamp(data.paidAt) ?? undefined,
    paidByUid: parseOptionalString(data.paidByUid),
    rejectedAt: parseTimestamp(data.rejectedAt) ?? undefined,
    rejectedByUid: parseOptionalString(data.rejectedByUid),
    rejectionReason: parseOptionalString(data.rejectionReason),
    adminNotes: parseOptionalString(data.adminNotes),
  }
}

function buildMyPayoutRequestsQuery(userUid: string) {
  return query(
    collection(getFirebaseDb(), COLLECTIONS.referralPayoutRequests),
    where('userUid', '==', userUid.trim()),
    orderBy('requestedAt', 'desc'),
  )
}

function buildAdminPayoutRequestsQuery() {
  return query(
    collection(getFirebaseDb(), COLLECTIONS.referralPayoutRequests),
    orderBy('requestedAt', 'desc'),
  )
}

export function subscribeMyReferralPayoutRequests(
  userUid: string,
  onUpdate: (requests: ReferralPayoutRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const normalizedUid = userUid.trim()

  if (!normalizedUid) {
    onUpdate([])
    return () => undefined
  }

  return onSnapshot(
    buildMyPayoutRequestsQuery(normalizedUid),
    (snapshot) => {
      const requests = snapshot.docs.map((doc) =>
        mapReferralPayoutRequestDocument(doc.id, doc.data()),
      )
      onUpdate(requests)
    },
    (error) => {
      onError?.(error instanceof Error ? error : new Error('Error al cargar solicitudes de pago'))
    },
  )
}

export function subscribeAdminReferralPayoutRequests(
  onUpdate: (requests: ReferralPayoutRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    buildAdminPayoutRequestsQuery(),
    (snapshot) => {
      const requests = snapshot.docs.map((doc) =>
        mapReferralPayoutRequestDocument(doc.id, doc.data()),
      )
      onUpdate(requests)
    },
    (error) => {
      onError?.(
        error instanceof Error ? error : new Error('Error al cargar solicitudes de pago admin'),
      )
    },
  )
}

export const referralPayoutReaderService = {
  mapReferralPayoutRequestDocument,
  subscribeMyReferralPayoutRequests,
  subscribeAdminReferralPayoutRequests,
}
