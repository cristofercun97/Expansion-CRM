import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Textarea } from '@/components/ui'
import { REFERRAL_PAYOUT_COPY } from '@/features/referrals/utils/referralPayoutCopy'

type AdminMarkPayoutPaidModalProps = {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (adminNotes?: string) => Promise<void>
}

export function AdminMarkPayoutPaidModal({
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: AdminMarkPayoutPaidModalProps) {
  const [adminNotes, setAdminNotes] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setAdminNotes('')
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
    setSubmitError('')

    try {
      const notes = adminNotes.trim()
      await onConfirm(notes.length > 0 ? notes : undefined)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'No pudimos marcar la solicitud como pagada.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar confirmación"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mark-paid-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="mark-paid-title" className="text-xl font-semibold text-text-dark">
              {REFERRAL_PAYOUT_COPY.adminMarkPaidTitle}
            </h2>
            <p className="mt-1 text-sm text-text-soft">
              {REFERRAL_PAYOUT_COPY.adminMarkPaidDescription}
            </p>
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
            label="Notas internas (opcional)"
            name="adminNotes"
            rows={3}
            value={adminNotes}
            disabled={isSubmitting}
            helperText="Solo para auditoría interna."
            onChange={(event) => setAdminNotes(event.target.value)}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                'Confirmar pago manual'
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
