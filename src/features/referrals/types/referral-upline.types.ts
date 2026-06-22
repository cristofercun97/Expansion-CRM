import type { Timestamp } from 'firebase/firestore'

export type ReferralUplineSource =
  | 'invite'
  | 'recommendation'
  | 'activation_request'
  | 'backfill'
  | 'fallback'

export type ReferralUplineFields = {
  referralUpline?: string[]
  referralUplineSource?: ReferralUplineSource
  referralUplineUpdatedAt?: Timestamp | null
}
