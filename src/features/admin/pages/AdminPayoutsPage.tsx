import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader'
import { AdminPayoutRequestsPanel } from '@/features/admin/components/AdminPayoutRequestsPanel'
import { REFERRAL_PAYOUT_COPY } from '@/features/referrals/utils/referralPayoutCopy'

export function AdminPayoutsPage() {
  return (
    <div className="px-8 py-8">
      <AdminPageHeader
        title={REFERRAL_PAYOUT_COPY.adminPageTitle}
        subtitle={REFERRAL_PAYOUT_COPY.adminPageSubtitle}
      />

      <section className="mt-10" aria-label="Solicitudes de pago">
        <AdminPayoutRequestsPanel />
      </section>
    </div>
  )
}
