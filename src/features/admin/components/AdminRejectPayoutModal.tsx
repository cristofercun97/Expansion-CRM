import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Textarea } from '@/components/ui'
import { REFERRAL_PAYOUT_COPY } from '@/features/referrals/utils/referralPayoutCopy'

type AdminRejectPayoutModalProps = {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (reason: string, returnRewardsToPayable: boolean) => Promise<void>
}

export function AdminRejectPayoutModal({
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminRejectPayoutModalProps) {
  const [reason, setReason] = useState('')
  const [returnRewardsToPayable, setReturnRewardsToPayable] = useState(true)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setReason('')
    setReturnRewardsToPayable(true)
    setSubmitError('')

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isSubmitting, onClose, open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedReason = reason.trim()

    if (trimmedReason.length < 3) {
      setSubmitError('El motivo debe tener al menos 3 caracteres.')
      return
    }

    setSubmitError('')

    try {
      await onConfirm(trimmedReason, returnRewardsToPayable)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No pudimos rechazar la solicitud.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar rechazo"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-payout-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="reject-payout-title" className="text-xl font-semibold text-text-dark">
              {REFERRAL_PAYOUT_COPY.adminRejectTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-text-soft transition-colors hover:bg-petrol-dark/5 hover:text-text-dark disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {submitError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <Textarea
            label="Motivo del rechazo"
            name="reason"
            rows={3}
            value={reason}
            required
            disabled={isSubmitting}
            onChange={(event) => setReason(event.target.value)}
          />

          <label className="flex items-start gap-3 rounded-lg border border-petrol-dark/10 bg-petrol-dark/5 px-3 py-3 text-sm text-text-dark">
            <input
              type="checkbox"
              checked={returnRewardsToPayable}
              disabled={isSubmitting}
              onChange={(event) => setReturnRewardsToPayable(event.target.checked)}
              className="mt-0.5"
            />
            <span>{REFERRAL_PAYOUT_COPY.adminReturnToPayable}</span>
          </label>

          {!returnRewardsToPayable ? (
            <p className="text-sm font-medium text-red-700">
              {REFERRAL_PAYOUT_COPY.adminCancelRewardsWarning}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Rechazando...
                </>
              ) : (
                'Confirmar rechazo'
              )}
            </Button>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
