import type { ReferralRewardStatus } from '@/features/referrals/types/referral-reward.types'
import { REFERRAL_REWARDS_STATUS_COPY } from '@/features/referrals/utils/referralRewardCopy'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CLASS: Record<ReferralRewardStatus, string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  approved: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  payable: 'border-teal-accent/30 bg-teal-accent/10 text-teal-accent',
  requested: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
  paid: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  cancelled: 'border-white/15 bg-white/5 text-hero-text/55',
}

type ReferralRewardStatusBadgeProps = {
  status: ReferralRewardStatus
  className?: string
}

export function ReferralRewardStatusBadge({ status, className }: ReferralRewardStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {REFERRAL_REWARDS_STATUS_COPY[status].label}
    </span>
  )
}
