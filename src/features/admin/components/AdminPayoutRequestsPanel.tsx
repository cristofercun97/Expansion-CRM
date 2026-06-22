import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { AdminMarkPayoutPaidModal } from '@/features/admin/components/AdminMarkPayoutPaidModal'
import { AdminRejectPayoutModal } from '@/features/admin/components/AdminRejectPayoutModal'
import { adminGlassCardClassName } from '@/features/admin/constants/adminNavItems'
import { ReferralPayoutStatusBadge } from '@/features/referrals/components/ReferralPayoutStatusBadge'
import { useAdminReferralPayoutRequests } from '@/features/referrals/hooks/useAdminReferralPayoutRequests'
import { referralPayoutFunctionsService } from '@/features/referrals/services/referral-payout-functions.service'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'
import { REFERRAL_PAYOUT_COPY, REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS } from '@/features/referrals/utils/referralPayoutCopy'
import {
  buildReferralPayoutAdminStats,
  extractCallableErrorMessage,
  formatReferralPayoutAmount,
  formatReferralPayoutDate,
} from '@/features/referrals/utils/referralPayoutUtils'

type AdminPayoutAction = 'markPaid' | 'reject'

export function AdminPayoutRequestsPanel() {
  const { showToast } = useToast()
  const { requests, loading, error } = useAdminReferralPayoutRequests()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ReferralPayoutRequest | null>(null)
  const [activeAction, setActiveAction] = useState<AdminPayoutAction | null>(null)

  const stats = useMemo(() => buildReferralPayoutAdminStats(requests), [requests])

  async function handleApprove(requestId: string) {
    setProcessingId(requestId)

    try {
      await referralPayoutFunctionsService.adminApproveReferralPayout(requestId)
      showToast('Solicitud aprobada.', 'success')
    } catch (approveError) {
      showToast(extractCallableErrorMessage(approveError), 'info')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleMarkPaid(adminNotes?: string) {
    if (!selectedRequest) {
      return
    }

    setProcessingId(selectedRequest.requestId)

    try {
      await referralPayoutFunctionsService.adminMarkReferralPayoutPaid(
        selectedRequest.requestId,
        adminNotes,
      )
      showToast('Solicitud marcada como pagada.', 'success')
      setActiveAction(null)
      setSelectedRequest(null)
    } catch (paidError) {
      throw new Error(extractCallableErrorMessage(paidError))
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(reason: string, returnRewardsToPayable: boolean) {
    if (!selectedRequest) {
      return
    }

    setProcessingId(selectedRequest.requestId)

    try {
      await referralPayoutFunctionsService.adminRejectReferralPayout(
        selectedRequest.requestId,
        reason,
        returnRewardsToPayable,
      )
      showToast('Solicitud rechazada.', 'success')
      setActiveAction(null)
      setSelectedRequest(null)
    } catch (rejectError) {
      throw new Error(extractCallableErrorMessage(rejectError))
    } finally {
      setProcessingId(null)
    }
  }

  function openMarkPaid(request: ReferralPayoutRequest) {
    setSelectedRequest(request)
    setActiveAction('markPaid')
  }

  function openReject(request: ReferralPayoutRequest) {
    setSelectedRequest(request)
    setActiveAction('reject')
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-hero-text/70">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando solicitudes de pago...
      </p>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {label: 'Pendiente por revisar', count: stats.pendingCount, amount: stats.pendingAmount},
          {label: 'Aprobado', count: stats.approvedCount, amount: stats.approvedAmount},
          {label: 'Pagado', count: stats.paidCount, amount: stats.paidAmount},
          {label: 'Rechazado', count: stats.rejectedCount, amount: stats.rejectedAmount},
          {label: 'Total abierto', count: stats.pendingCount + stats.approvedCount, amount: stats.openAmount},
        ].map((kpi) => (
          <article key={kpi.label} className={adminGlassCardClassName}>
            <p className="text-xs uppercase tracking-wide text-hero-text/60">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gold-light">
              {formatReferralPayoutAmount(kpi.amount)}
            </p>
            <p className="mt-1 text-sm text-hero-text/65">
              {kpi.count} {kpi.count === 1 ? 'solicitud' : 'solicitudes'}
            </p>
          </article>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className={`mt-6 ${adminGlassCardClassName} text-sm text-hero-text/70`}>
          {REFERRAL_PAYOUT_COPY.adminEmpty}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {requests.map((request) => {
            const isProcessing = processingId === request.requestId
            const canAct = request.status === 'pending' || request.status === 'approved'
            const isReadOnly =
              request.status === 'paid' ||
              request.status === 'rejected' ||
              request.status === 'cancelled'

            return (
              <li key={request.requestId} className={adminGlassCardClassName}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-hero-text">
                      {request.userName || request.userEmail || request.userUid}
                    </p>
                    {request.userEmail ? (
                      <p className="text-sm text-hero-text/65">{request.userEmail}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-hero-text/65">
                      {formatReferralPayoutDate(request.requestedAt)}
                    </p>
                  </div>
                  <ReferralPayoutStatusBadge status={request.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-hero-text/60">Importe</p>
                    <p className="mt-1 text-xl font-semibold text-gold-light">
                      {formatReferralPayoutAmount(request.amount, request.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-hero-text/60">Recompensas</p>
                    <p className="mt-1 text-sm text-hero-text">{request.rewardCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-hero-text/60">Referencia</p>
                    <p className="mt-1 text-xs text-hero-text/65">{request.requestId}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/75">
                  <p>
                    <span className="text-hero-text/60">Método:</span>{' '}
                    {REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS[request.paymentMethodSnapshot.type]}
                  </p>
                  <p className="mt-1">
                    <span className="text-hero-text/60">Etiqueta:</span>{' '}
                    {request.paymentMethodSnapshot.label}
                  </p>
                  <p className="mt-1 break-words">
                    <span className="text-hero-text/60">Detalles:</span>{' '}
                    {request.paymentMethodSnapshot.details}
                  </p>
                </div>

                <details className="mt-3 text-sm text-hero-text/65">
                  <summary className="cursor-pointer text-teal-accent">
                    Ver {request.rewardIds.length} rewardIds
                  </summary>
                  <p className="mt-2 break-all text-xs">{request.rewardIds.join(', ')}</p>
                </details>

                {request.rejectionReason ? (
                  <p className="mt-3 text-sm text-red-200">
                    <span className="font-medium">Motivo de rechazo:</span> {request.rejectionReason}
                  </p>
                ) : null}

                {request.adminNotes ? (
                  <p className="mt-3 text-sm text-hero-text/75">
                    <span className="font-medium text-hero-text">Notas:</span> {request.adminNotes}
                  </p>
                ) : null}

                {canAct ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {request.status === 'pending' ? (
                      <Button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void handleApprove(request.requestId)}
                      >
                        {isProcessing ? 'Procesando...' : 'Aprobar'}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => openMarkPaid(request)}
                    >
                      Marcar pagado
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isProcessing}
                      className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
                      onClick={() => openReject(request)}
                    >
                      Rechazar
                    </Button>
                  </div>
                ) : isReadOnly ? (
                  <p className="mt-4 text-xs text-hero-text/55">Solo lectura</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <AdminMarkPayoutPaidModal
        open={activeAction === 'markPaid' && selectedRequest !== null}
        isSubmitting={processingId !== null}
        onClose={() => {
          if (processingId === null) {
            setActiveAction(null)
            setSelectedRequest(null)
          }
        }}
        onConfirm={handleMarkPaid}
      />

      <AdminRejectPayoutModal
        open={activeAction === 'reject' && selectedRequest !== null}
        isSubmitting={processingId !== null}
        onClose={() => {
          if (processingId === null) {
            setActiveAction(null)
            setSelectedRequest(null)
          }
        }}
        onConfirm={handleReject}
      />
    </>
  )
}
