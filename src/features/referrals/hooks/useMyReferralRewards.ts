import { useEffect, useMemo, useState } from 'react'
import { subscribeMyReferralRewards } from '@/features/referrals/services/referral-rewards-reader.service'
import type { ReferralReward } from '@/features/referrals/types/referral-reward.types'
import type { ReferralRewardsDashboardStats } from '@/features/referrals/types/referral-rewards-dashboard.types'
import { buildReferralRewardDashboardStats } from '@/features/referrals/utils/referralRewardDashboardUtils'

type UseMyReferralRewardsResult = {
  rewards: ReferralReward[]
  stats: ReferralRewardsDashboardStats
  loading: boolean
  error: string
}

const EMPTY_STATS = buildReferralRewardDashboardStats([])

export function useMyReferralRewards(userUid: string | null | undefined): UseMyReferralRewardsResult {
  const [rewards, setRewards] = useState<ReferralReward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const normalizedUid = userUid?.trim()

    if (!normalizedUid) {
      setRewards([])
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    const unsubscribe = subscribeMyReferralRewards(
      normalizedUid,
      (nextRewards) => {
        setRewards(nextRewards)
        setLoading(false)
        setError('')
      },
      (subscriptionError) => {
        setRewards([])
        setLoading(false)
        setError(subscriptionError.message || 'No pudimos cargar tus recompensas.')
      },
    )

    return unsubscribe
  }, [userUid])

  const stats = useMemo(() => buildReferralRewardDashboardStats(rewards), [rewards])

  return {
    rewards,
    stats: loading && rewards.length === 0 ? EMPTY_STATS : stats,
    loading,
    error,
  }
}
