import { useEffect, useState } from 'react'
import { subscribeAdminReferralPayoutRequests } from '@/features/referrals/services/referral-payout-reader.service'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'

type UseAdminReferralPayoutRequestsResult = {
  requests: ReferralPayoutRequest[]
  loading: boolean
  error: string
}

export function useAdminReferralPayoutRequests(): UseAdminReferralPayoutRequestsResult {
  const [requests, setRequests] = useState<ReferralPayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    const unsubscribe = subscribeAdminReferralPayoutRequests(
      (nextRequests) => {
        setRequests(nextRequests)
        setLoading(false)
        setError('')
      },
      (subscriptionError) => {
        setRequests([])
        setLoading(false)
        setError(
          subscriptionError.message || 'No pudimos cargar las solicitudes de pago.',
        )
      },
    )

    return unsubscribe
  }, [])

  return {requests, loading, error}
}
