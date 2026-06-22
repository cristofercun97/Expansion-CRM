import type { ReferralPayoutRequestStatus } from '@/features/referrals/types/referral-payout-request.types'
import { REFERRAL_PAYOUT_STATUS_LABELS } from '@/features/referrals/utils/referralPayoutCopy'
import { cn } from '@/lib/utils'

const STATUS_BADGE_CLASS: Record<ReferralPayoutRequestStatus, string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  approved: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  paid: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  rejected: 'border-red-400/30 bg-red-400/10 text-red-200',
  cancelled: 'border-white/15 bg-white/5 text-hero-text/55',
}

type ReferralPayoutStatusBadgeProps = {
  status: ReferralPayoutRequestStatus
  className?: string
}

export function ReferralPayoutStatusBadge({ status, className }: ReferralPayoutStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {REFERRAL_PAYOUT_STATUS_LABELS[status]}
    </span>
  )
}
