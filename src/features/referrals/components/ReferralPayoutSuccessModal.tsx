import { PartyPopper } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import { REFERRAL_PAYOUT_COPY } from '@/features/referrals/utils/referralPayoutCopy'

type ReferralPayoutSuccessModalProps = {
  open: boolean
  onClose: () => void
}

export function ReferralPayoutSuccessModal({ open, onClose }: ReferralPayoutSuccessModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] min-h-[100dvh]">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm"
        aria-label="Cerrar mensaje de confirmación"
        onClick={onClose}
      />

      <div className="relative flex h-full min-h-[100dvh] items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-success-title"
          className="relative z-10 w-full max-w-md rounded-2xl border border-gold/25 bg-white p-8 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold">
            <PartyPopper className="h-8 w-8" aria-hidden="true" />
          </div>

          <h2 id="payout-success-title" className="mt-5 text-2xl font-semibold text-text-dark">
            {REFERRAL_PAYOUT_COPY.requestSuccessModalTitle}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-text-soft">
            {REFERRAL_PAYOUT_COPY.requestSuccessModalDescription}
          </p>

          <Button
            type="button"
            className="mt-8 w-full bg-gold text-petrol-deep hover:bg-gold-light"
            onClick={onClose}
          >
            {REFERRAL_PAYOUT_COPY.requestSuccessModalButton}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
