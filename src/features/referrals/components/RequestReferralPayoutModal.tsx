import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button, Input, Textarea } from '@/components/ui'
import type { ReferralPayoutPaymentMethodType } from '@/features/referrals/types/referral-payout-request.types'
import { REFERRAL_PAYOUT_COPY, REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS } from '@/features/referrals/utils/referralPayoutCopy'
import { formatReferralRewardAmount } from '@/features/referrals/utils/referralRewardDashboardUtils'
import {
  DEFAULT_REQUEST_PAYOUT_FORM,
  hasRequestPayoutFormErrors,
  MIN_REFERRAL_PAYOUT_AMOUNT_EUR,
  validateRequestPayoutForm,
  type RequestPayoutFormErrors,
  type RequestPayoutFormValues,
} from '@/features/referrals/utils/referralPayoutUtils'

type RequestReferralPayoutModalProps = {
  open: boolean
  isSubmitting: boolean
  availableAmount: number
  onClose: () => void
  onSubmit: (values: RequestPayoutFormValues) => Promise<void>
}

const selectClassName =
  'h-10 w-full rounded-lg border border-petrol-dark/15 bg-white px-3 text-sm text-text-dark transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-60'

export function RequestReferralPayoutModal({
  open,
  isSubmitting,
  availableAmount,
  onClose,
  onSubmit,
}: RequestReferralPayoutModalProps) {
  const [values, setValues] = useState<RequestPayoutFormValues>(DEFAULT_REQUEST_PAYOUT_FORM)
  const [fieldErrors, setFieldErrors] = useState<RequestPayoutFormErrors>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setValues(DEFAULT_REQUEST_PAYOUT_FORM)
    setFieldErrors({})
    setSubmitError('')
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

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

  const canSubmit = availableAmount >= MIN_REFERRAL_PAYOUT_AMOUNT_EUR && !isSubmitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateRequestPayoutForm(values, availableAmount)

    if (hasRequestPayoutFormErrors(errors)) {
      setFieldErrors(errors)
      setSubmitError('Revisa los campos marcados antes de confirmar.')
      return
    }

    setFieldErrors({})
    setSubmitError('')

    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'No pudimos enviar la solicitud. Intenta nuevamente.',
      )
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] min-h-[100dvh]">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-sm"
        aria-label="Cerrar formulario"
        disabled={isSubmitting}
        onClick={onClose}
      />

      <div className="relative flex h-full min-h-[100dvh] items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-payout-title"
          className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-petrol-dark/10 bg-white p-6 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="request-payout-title" className="text-xl font-semibold text-text-dark">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalTitle}
              </h2>
              <p className="mt-1 text-sm text-text-soft">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalNote}
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

          <div className="mt-5 grid gap-3 rounded-xl border border-petrol-dark/10 bg-petrol-dark/5 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-soft">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalAvailableBalance}
              </p>
              <p className="mt-1 text-lg font-semibold text-text-dark">
                {formatReferralRewardAmount(availableAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-soft">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalMinimumWithdrawal}
              </p>
              <p className="mt-1 text-lg font-semibold text-text-dark">
                {formatReferralRewardAmount(MIN_REFERRAL_PAYOUT_AMOUNT_EUR)}
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {submitError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="payout-request-amount" className="text-sm font-medium text-text-dark">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalAmountLabel}
              </label>
              <input
                id="payout-request-amount"
                name="amount"
                type="number"
                inputMode="decimal"
                min={MIN_REFERRAL_PAYOUT_AMOUNT_EUR}
                max={availableAmount}
                step="0.01"
                value={values.amount}
                disabled={isSubmitting}
                placeholder={REFERRAL_PAYOUT_COPY.paymentMethodModalAmountPlaceholder}
                onChange={(event) =>
                  setValues((current) => ({ ...current, amount: event.target.value }))
                }
                className={selectClassName}
              />
              <p className="text-xs text-text-soft">
                {REFERRAL_PAYOUT_COPY.paymentMethodModalAmountHint}
              </p>
              {fieldErrors.amount ? (
                <p className="text-xs text-red-600">{fieldErrors.amount}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="payout-method-type" className="text-sm font-medium text-text-dark">
                Tipo
              </label>
              <select
                id="payout-method-type"
                name="type"
                value={values.type}
                disabled={isSubmitting}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    type: event.target.value as ReferralPayoutPaymentMethodType | '',
                  }))
                }
                className={selectClassName}
              >
                <option value="">Selecciona un tipo</option>
                {(Object.keys(REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS) as ReferralPayoutPaymentMethodType[]).map(
                  (type) => (
                    <option key={type} value={type}>
                      {REFERRAL_PAYOUT_PAYMENT_TYPE_LABELS[type]}
                    </option>
                  ),
                )}
              </select>
              {fieldErrors.type ? (
                <p className="text-xs text-red-600">{fieldErrors.type}</p>
              ) : null}
            </div>

            <Input
              label="Etiqueta"
              name="label"
              value={values.label}
              disabled={isSubmitting}
              error={fieldErrors.label}
              placeholder='Ej. "Cuenta bancaria", "USDT TRC20", "PayPal"'
              onChange={(event) =>
                setValues((current) => ({ ...current, label: event.target.value }))
              }
            />

            <Textarea
              label="Detalles"
              name="details"
              rows={4}
              value={values.details}
              disabled={isSubmitting}
              error={fieldErrors.details}
              placeholder="IBAN, wallet, email de PayPal u otras instrucciones para el pago manual."
              onChange={(event) =>
                setValues((current) => ({ ...current, details: event.target.value }))
              }
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="min-w-[140px] bg-gold text-petrol-deep hover:bg-gold-light"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  'Confirmar solicitud'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
