import type { Timestamp } from 'firebase/firestore'

export type ReferralPayoutPaymentMethodType = 'bank' | 'crypto' | 'paypal' | 'other'

export type ReferralPayoutPaymentMethodSnapshot = {
  type: ReferralPayoutPaymentMethodType
  label: string
  details: string
}

export type ReferralPayoutRequestStatus =
  | 'pending'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'cancelled'

export type ReferralPayoutRequest = {
  requestId: string
  userUid: string
  userName?: string
  userEmail?: string
  amount: number
  currency: 'EUR'
  status: ReferralPayoutRequestStatus
  rewardIds: string[]
  rewardCount: number
  paymentMethodSnapshot: ReferralPayoutPaymentMethodSnapshot
  requestedAt: Timestamp | null
  updatedAt: Timestamp | null
  approvedAt?: Timestamp | null
  approvedByUid?: string
  paidAt?: Timestamp | null
  paidByUid?: string
  rejectedAt?: Timestamp | null
  rejectedByUid?: string
  rejectionReason?: string
  adminNotes?: string
}

/** Input para callable `requestReferralPayout` (sin rewardIds). */
export type RequestReferralPayoutInput = {
  amount: number
  paymentMethodSnapshot: ReferralPayoutPaymentMethodSnapshot
}

/** Resultado de callable `requestReferralPayout`. */
export type RequestReferralPayoutResult = {
  requestId: string
  amount: number
  rewardCount: number
}

export type AdminApproveReferralPayoutInput = {
  requestId: string
}

export type AdminMarkReferralPayoutPaidInput = {
  requestId: string
  adminNotes?: string
}

export type AdminRejectReferralPayoutInput = {
  requestId: string
  reason: string
  returnRewardsToPayable: boolean
}
