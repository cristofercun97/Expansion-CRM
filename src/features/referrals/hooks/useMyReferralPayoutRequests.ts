import { useEffect, useState } from 'react'
import { subscribeMyReferralPayoutRequests } from '@/features/referrals/services/referral-payout-reader.service'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'

type UseMyReferralPayoutRequestsResult = {
  requests: ReferralPayoutRequest[]
  loading: boolean
  error: string
}

export function useMyReferralPayoutRequests(
  userUid: string | null | undefined,
): UseMyReferralPayoutRequestsResult {
  const [requests, setRequests] = useState<ReferralPayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const normalizedUid = userUid?.trim()

    if (!normalizedUid) {
      setRequests([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    const unsubscribe = subscribeMyReferralPayoutRequests(
      normalizedUid,
      (nextRequests) => {
        setRequests(nextRequests)
        setLoading(false)
        setError('')
      },
      (subscriptionError) => {
        setRequests([])
        setLoading(false)
        setError(subscriptionError.message || 'No pudimos cargar tus solicitudes de pago.')
      },
    )

    return unsubscribe
  }, [userUid])

  return {requests, loading, error}
}
