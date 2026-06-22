import type {
  ReferralPayoutPaymentMethodSnapshot,
  ReferralPayoutPaymentMethodType,
  ReferralPayoutRequest,
  ReferralPayoutRequestStatus,
} from '@/features/referrals/types/referral-payout-request.types'
import type { ReferralRewardsDashboardStats } from '@/features/referrals/types/referral-rewards-dashboard.types'
import { FirebaseError } from 'firebase/app'

const CARD_DIGITS_PATTERN = /\d{13,19}/
const CARD_KEYWORDS_PATTERN = /tarjeta|card\s*number|cvv/i

export const MIN_REFERRAL_PAYOUT_AMOUNT_EUR = 10

export type PaymentMethodFormValues = {
  type: ReferralPayoutPaymentMethodType | ''
  label: string
  details: string
}

export type RequestPayoutFormValues = PaymentMethodFormValues & {
  amount: string
}

export type PaymentMethodFormErrors = {
  type?: string
  label?: string
  details?: string
}

export type RequestPayoutFormErrors = PaymentMethodFormErrors & {
  amount?: string
}

export const DEFAULT_PAYMENT_METHOD_FORM: PaymentMethodFormValues = {
  type: '',
  label: '',
  details: '',
}

export const DEFAULT_REQUEST_PAYOUT_FORM: RequestPayoutFormValues = {
  ...DEFAULT_PAYMENT_METHOD_FORM,
  amount: '',
}

function parsePayoutAmountInput(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    return null
  }

  const amountCents = Math.round(parsed * 100)

  if (Math.abs(parsed * 100 - amountCents) > 1e-6) {
    return null
  }

  return amountCents / 100
}

export function validatePaymentMethodForm(
  values: PaymentMethodFormValues,
): PaymentMethodFormErrors {
  const errors: PaymentMethodFormErrors = {}

  if (!values.type) {
    errors.type = 'Selecciona un tipo de método.'
  }

  const label = values.label.trim()
  const details = values.details.trim()

  if (label.length < 2) {
    errors.label = 'La etiqueta debe tener al menos 2 caracteres.'
  }

  if (details.length < 6) {
    errors.details = 'Los detalles deben tener al menos 6 caracteres.'
  }

  const combined = `${label} ${details}`.toLowerCase()

  if (
    CARD_DIGITS_PATTERN.test(details) ||
    CARD_KEYWORDS_PATTERN.test(combined)
  ) {
    errors.details = 'No introduzcas datos de tarjeta ni CVV.'
  }

  return errors
}

export function hasPaymentMethodFormErrors(errors: PaymentMethodFormErrors): boolean {
  return Boolean(errors.type || errors.label || errors.details)
}

export function validateRequestPayoutForm(
  values: RequestPayoutFormValues,
  availableAmount: number,
): RequestPayoutFormErrors {
  const errors: RequestPayoutFormErrors = {
    ...validatePaymentMethodForm(values),
  }

  const parsedAmount = parsePayoutAmountInput(values.amount)

  if (parsedAmount === null) {
    errors.amount = 'Introduce una cantidad válida con máximo 2 decimales.'
    return errors
  }

  if (parsedAmount < MIN_REFERRAL_PAYOUT_AMOUNT_EUR) {
    errors.amount = `El retiro mínimo es de ${MIN_REFERRAL_PAYOUT_AMOUNT_EUR} €.`
    return errors
  }

  if (parsedAmount > availableAmount) {
    errors.amount = 'La cantidad no puede superar tu saldo disponible.'
  }

  return errors
}

export function hasRequestPayoutFormErrors(errors: RequestPayoutFormErrors): boolean {
  return Boolean(errors.type || errors.label || errors.details || errors.amount)
}

export function parseRequestPayoutAmount(values: RequestPayoutFormValues): number {
  const parsedAmount = parsePayoutAmountInput(values.amount)

  if (parsedAmount === null) {
    throw new Error('Cantidad inválida.')
  }

  return parsedAmount
}

export function toPaymentMethodSnapshot(
  values: PaymentMethodFormValues,
): ReferralPayoutPaymentMethodSnapshot {
  return {
    type: values.type as ReferralPayoutPaymentMethodType,
    label: values.label.trim(),
    details: values.details.trim(),
  }
}

export function formatReferralPayoutAmount(amount: number, currency = 'EUR'): string {
  if (currency === 'EUR') {
    return `${amount} €`
  }

  return `${amount} ${currency}`
}

export function formatReferralPayoutDate(
  timestamp: ReferralPayoutRequest['requestedAt'],
): string {
  if (!timestamp?.toDate) {
    return '—'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function hasActiveReferralPayoutRequest(requests: ReferralPayoutRequest[]): boolean {
  return requests.some(
    (request) => request.status === 'pending' || request.status === 'approved',
  )
}

export type ReferralPayoutAdminStats = {
  pendingCount: number
  pendingAmount: number
  approvedCount: number
  approvedAmount: number
  paidCount: number
  paidAmount: number
  rejectedCount: number
  rejectedAmount: number
  openAmount: number
}

export function buildReferralPayoutAdminStats(
  requests: ReferralPayoutRequest[],
): ReferralPayoutAdminStats {
  const sumByStatus = (status: ReferralPayoutRequestStatus) =>
    requests
      .filter((request) => request.status === status)
      .reduce((sum, request) => sum + request.amount, 0)

  const countByStatus = (status: ReferralPayoutRequestStatus) =>
    requests.filter((request) => request.status === status).length

  const pendingAmount = sumByStatus('pending')
  const approvedAmount = sumByStatus('approved')

  return {
    pendingCount: countByStatus('pending'),
    pendingAmount,
    approvedCount: countByStatus('approved'),
    approvedAmount,
    paidCount: countByStatus('paid'),
    paidAmount: sumByStatus('paid'),
    rejectedCount: countByStatus('rejected') + countByStatus('cancelled'),
    rejectedAmount: sumByStatus('rejected') + sumByStatus('cancelled'),
    openAmount: pendingAmount + approvedAmount,
  }
}

export function canRequestReferralPayout(
  stats: ReferralRewardsDashboardStats,
): boolean {
  return stats.payableAmount >= MIN_REFERRAL_PAYOUT_AMOUNT_EUR
}

export function extractCallableErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const message = error.message.trim()

    if (error.code === 'functions/internal') {
      return 'No se pudo procesar la solicitud. Inténtalo de nuevo o contacta al admin.'
    }

    if (message.length > 0 && message !== 'internal') {
      return message
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: string }).message).trim()

    if (message.length > 0 && message !== 'internal') {
      return message
    }
  }

  return 'No pudimos completar la operación. Intenta nuevamente.'
}
