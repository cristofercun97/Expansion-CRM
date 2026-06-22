import { httpsCallable } from 'firebase/functions'
import type {
  AdminApproveReferralPayoutInput,
  AdminMarkReferralPayoutPaidInput,
  AdminRejectReferralPayoutInput,
  ReferralPayoutPaymentMethodSnapshot,
  RequestReferralPayoutInput,
  RequestReferralPayoutResult,
} from '@/features/referrals/types/referral-payout-request.types'
import { getFirebaseFunctions } from '@/lib/firebase/functions'

async function callFunction<Input, Output>(name: string, data: Input): Promise<Output> {
  const callable = httpsCallable<Input, Output>(getFirebaseFunctions(), name)
  const result = await callable(data)
  return result.data
}

export async function requestReferralPayout(
  amount: number,
  paymentMethodSnapshot: ReferralPayoutPaymentMethodSnapshot,
): Promise<RequestReferralPayoutResult> {
  const payload: RequestReferralPayoutInput = { amount, paymentMethodSnapshot }
  return callFunction<RequestReferralPayoutInput, RequestReferralPayoutResult>(
    'requestReferralPayout',
    payload,
  )
}

export async function adminApproveReferralPayout(
  requestId: string,
): Promise<{ok: boolean; requestId: string}> {
  const payload: AdminApproveReferralPayoutInput = {requestId}
  return callFunction<AdminApproveReferralPayoutInput, {ok: boolean; requestId: string}>(
    'adminApproveReferralPayout',
    payload,
  )
}

export async function adminMarkReferralPayoutPaid(
  requestId: string,
  adminNotes?: string,
): Promise<{ok: boolean; requestId: string}> {
  const payload: AdminMarkReferralPayoutPaidInput = {requestId, adminNotes}
  return callFunction<AdminMarkReferralPayoutPaidInput, {ok: boolean; requestId: string}>(
    'adminMarkReferralPayoutPaid',
    payload,
  )
}

export async function adminRejectReferralPayout(
  requestId: string,
  reason: string,
  returnRewardsToPayable: boolean,
): Promise<{ok: boolean; requestId: string}> {
  const payload: AdminRejectReferralPayoutInput = {
    requestId,
    reason,
    returnRewardsToPayable,
  }
  return callFunction<AdminRejectReferralPayoutInput, {ok: boolean; requestId: string}>(
    'adminRejectReferralPayout',
    payload,
  )
}

export const referralPayoutFunctionsService = {
  requestReferralPayout,
  adminApproveReferralPayout,
  adminMarkReferralPayoutPaid,
  adminRejectReferralPayout,
}
