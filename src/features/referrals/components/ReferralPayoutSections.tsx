import { ChevronDown, ChevronUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { ReferralPayoutSuccessModal } from '@/features/referrals/components/ReferralPayoutSuccessModal'
import { RequestReferralPayoutModal } from '@/features/referrals/components/RequestReferralPayoutModal'
import { referralPayoutFunctionsService } from '@/features/referrals/services/referral-payout-functions.service'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'
import type { ReferralRewardsDashboardStats } from '@/features/referrals/types/referral-rewards-dashboard.types'
import { REFERRAL_PAYOUT_COPY, REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS } from '@/features/referrals/utils/referralPayoutCopy'
import {
  canRequestReferralPayout,
  extractCallableErrorMessage,
  formatReferralPayoutAmount,
  formatReferralPayoutDate,
  hasActiveReferralPayoutRequest,
  MIN_REFERRAL_PAYOUT_AMOUNT_EUR,
  parseRequestPayoutAmount,
  toPaymentMethodSnapshot,
  type RequestPayoutFormValues,
} from '@/features/referrals/utils/referralPayoutUtils'
import { formatReferralRewardAmount } from '@/features/referrals/utils/referralRewardDashboardUtils'
import { ReferralPayoutStatusBadge } from '@/features/referrals/components/ReferralPayoutStatusBadge'

type ReferralPayoutRequestSectionProps = {
  stats: ReferralRewardsDashboardStats
  payoutRequests: ReferralPayoutRequest[]
  rewardsLoading: boolean
  payoutRequestsLoading: boolean
}

export function ReferralPayoutRequestSection({
  stats,
  payoutRequests,
  rewardsLoading,
  payoutRequestsLoading,
}: ReferralPayoutRequestSectionProps) {
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canRequest = canRequestReferralPayout(stats)
  const hasActiveRequest = hasActiveReferralPayoutRequest(payoutRequests)
  const isLoading = rewardsLoading || payoutRequestsLoading
  const hasInsufficientBalanceForMinimum =
    stats.payableAmount > 0 && stats.payableAmount < MIN_REFERRAL_PAYOUT_AMOUNT_EUR

  async function handleSubmitPaymentMethod(values: RequestPayoutFormValues) {
    setIsSubmitting(true)

    try {
      await referralPayoutFunctionsService.requestReferralPayout(
        parseRequestPayoutAmount(values),
        toPaymentMethodSnapshot(values),
      )
      setModalOpen(false)
      setSuccessModalOpen(true)
      showToast(REFERRAL_PAYOUT_COPY.requestSuccessToast, 'success')
    } catch (error) {
      throw new Error(extractCallableErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-hero-text">
            {REFERRAL_PAYOUT_COPY.requestSectionTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-hero-text/70">
            {REFERRAL_PAYOUT_COPY.requestSectionDescription}
          </p>
        </div>

        <article className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-accent/15 text-teal-accent">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-hero-text/60">
                    {REFERRAL_PAYOUT_COPY.payableReady}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gold-light">
                    {formatReferralRewardAmount(stats.payableAmount)}
                  </p>
                  <p className="mt-1 text-sm text-hero-text/65">
                    {stats.payableCount}{' '}
                    {stats.payableCount === 1 ? 'recompensa' : 'recompensas'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-hero-text/60">
                    {REFERRAL_PAYOUT_COPY.requestedInReview}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-hero-text">
                    {formatReferralRewardAmount(stats.requestedAmount)}
                  </p>
                  <p className="mt-1 text-sm text-hero-text/65">
                    {stats.requestedCount}{' '}
                    {stats.requestedCount === 1 ? 'recompensa' : 'recompensas'}
                  </p>
                </div>
              </div>

              {hasActiveRequest ? (
                <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                  {REFERRAL_PAYOUT_COPY.activeRequestNote}
                </p>
              ) : null}

              {stats.payableAmount <= 0 && !isLoading ? (
                <p className="mt-4 text-sm text-hero-text/65">
                  {REFERRAL_PAYOUT_COPY.noPayableEmpty}
                </p>
              ) : null}

              {hasInsufficientBalanceForMinimum && !isLoading ? (
                <p className="mt-4 text-sm text-hero-text/65">
                  {REFERRAL_PAYOUT_COPY.minimumWithdrawalNote}
                </p>
              ) : null}

              <Button
                type="button"
                className="mt-5 bg-gold text-petrol-deep hover:bg-gold-light"
                disabled={!canRequest || isLoading || isSubmitting}
                onClick={() => setModalOpen(true)}
              >
                {REFERRAL_PAYOUT_COPY.requestButton}
              </Button>
            </div>
          </div>
        </article>
      </section>

      <RequestReferralPayoutModal
        open={modalOpen}
        isSubmitting={isSubmitting}
        availableAmount={stats.payableAmount}
        onClose={() => {
          if (!isSubmitting) {
            setModalOpen(false)
          }
        }}
        onSubmit={handleSubmitPaymentMethod}
      />

      <ReferralPayoutSuccessModal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  )
}

type MyReferralPayoutRequestsSectionProps = {
  requests: ReferralPayoutRequest[]
  loading: boolean
}

function PayoutRequestMethodDetails({
  request,
}: {
  request: ReferralPayoutRequest
}) {
  const [expanded, setExpanded] = useState(false)
  const details = request.paymentMethodSnapshot.details
  const isLong = details.length > 80

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-hero-text/75">
      <p>
        <span className="text-hero-text/60">Método:</span>{' '}
        {REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS[request.paymentMethodSnapshot.type]}
      </p>
      <p className="mt-1">
        <span className="text-hero-text/60">Etiqueta:</span>{' '}
        {request.paymentMethodSnapshot.label}
      </p>
      <p className="mt-1">
        <span className="text-hero-text/60">Detalles:</span>{' '}
        {isLong && !expanded ? `${details.slice(0, 80)}…` : details}
      </p>
      {isLong ? (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-xs text-teal-accent"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              Ocultar detalles
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              Ver detalles
            </>
          )}
        </button>
      ) : null}
    </div>
  )
}

export function MyReferralPayoutRequestsSection({
  requests,
  loading,
}: MyReferralPayoutRequestsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-hero-text">
        {REFERRAL_PAYOUT_COPY.myRequestsTitle}
      </h2>

      {loading ? (
        <p className="text-sm text-hero-text/70">Cargando solicitudes de pago...</p>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-white/15 bg-white/8 px-4 py-5 text-sm text-hero-text/70 backdrop-blur-xl">
          {REFERRAL_PAYOUT_COPY.myRequestsEmpty}
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request.requestId}
              className="rounded-2xl border border-white/15 bg-white/8 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-hero-text/65">
                    {formatReferralPayoutDate(request.requestedAt)}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gold-light">
                    {formatReferralPayoutAmount(request.amount, request.currency)}
                  </p>
                  <p className="mt-1 text-sm text-hero-text/70">
                    {request.rewardCount}{' '}
                    {request.rewardCount === 1 ? 'recompensa' : 'recompensas'}
                  </p>
                </div>
                <ReferralPayoutStatusBadge status={request.status} />
              </div>

              <PayoutRequestMethodDetails request={request} />

              {request.rejectionReason ? (
                <p className="mt-3 text-sm text-red-200">
                  <span className="font-medium">Motivo de rechazo:</span>{' '}
                  {request.rejectionReason}
                </p>
              ) : null}

              {request.adminNotes ? (
                <p className="mt-3 text-sm text-hero-text/75">
                  <span className="font-medium text-hero-text">Notas del equipo:</span>{' '}
                  {request.adminNotes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
