import { Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui'
import type {
  SalesGoalCurrency,
  SalesGoalPeriodType,
  TeamSalesGoal,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  buildSalesPeriodKey,
  formatSalesCurrency,
  SALES_GOAL_COPY,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type SalesGoalModalProps = {
  open: boolean
  initialGoal: TeamSalesGoal | null
  saving?: boolean
  onClose: () => void
  onSave: (input: {
    periodType: SalesGoalPeriodType
    targetAmount: number
    currency: SalesGoalCurrency
    description?: string | null
  }) => Promise<void>
}

export function SalesGoalModal({
  open,
  initialGoal,
  saving = false,
  onClose,
  onSave,
}: SalesGoalModalProps) {
  const [periodType, setPeriodType] = useState<SalesGoalPeriodType>('monthly')
  const [targetAmount, setTargetAmount] = useState('')
  const [currency, setCurrency] = useState<SalesGoalCurrency>('EUR')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const isEditing = Boolean(initialGoal)
  const selectedPeriod = useMemo(
    () => buildSalesPeriodKey(periodType),
    [periodType],
  )
  const parsedPreviewAmount = Number(targetAmount.replace(',', '.'))
  const previewAmount =
    Number.isFinite(parsedPreviewAmount) && parsedPreviewAmount > 0
      ? formatSalesCurrency(parsedPreviewAmount, currency)
      : null

  useEffect(() => {
    if (!open) {
      return
    }

    setPeriodType(initialGoal?.periodType ?? 'monthly')
    setTargetAmount(initialGoal ? String(initialGoal.targetAmount) : '')
    setCurrency(initialGoal?.currency ?? 'EUR')
    setDescription(initialGoal?.description ?? '')
    setError('')
  }, [initialGoal, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const parsedAmount = Number(targetAmount.replace(',', '.'))

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Introduce un importe objetivo válido mayor que cero.')
      return
    }

    try {
      await onSave({
        periodType,
        targetAmount: parsedAmount,
        currency,
        description: description.trim() || null,
      })
      onClose()
    } catch {
      setError('No se pudo guardar el objetivo. Inténtalo de nuevo.')
    }
  }

  return (
    <ModalShell
      title={isEditing ? SALES_GOAL_COPY.modalAdjustTitle : SALES_GOAL_COPY.modalConfigureTitle}
      description={SALES_GOAL_COPY.modalDescription}
      onClose={onClose}
      disabled={saving}
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void handleSubmit(event)}>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <Field label="Periodo">
            <div className="grid grid-cols-2 gap-2">
              {(['weekly', 'monthly'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                    periodType === option
                      ? 'border-gold/30 bg-gold/10 text-gold-light'
                      : 'border-white/15 bg-white/5 text-hero-text/75 hover:bg-white/10',
                  )}
                  onClick={() => setPeriodType(option)}
                >
                  {option === 'weekly' ? 'Semanal' : 'Mensual'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-hero-text/60">
              {SALES_GOAL_COPY.modalPeriodHint}
            </p>
            <p className="mt-2 rounded-xl border border-teal-accent/20 bg-teal-accent/8 px-3 py-2 text-xs font-medium text-teal-accent">
              {SALES_GOAL_COPY.modalPeriodAppliesTo(selectedPeriod.periodLabel)}
            </p>
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Importe objetivo">
              <input
                type="number"
                min="1"
                step="1"
                value={targetAmount}
                placeholder="5000"
                className={inputClassName}
                onChange={(event) => setTargetAmount(event.target.value)}
              />
            </Field>

            <Field label="Moneda">
              <select
                value={currency}
                className={inputClassName}
                onChange={(event) => setCurrency(event.target.value as SalesGoalCurrency)}
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
          </div>

          {previewAmount ? (
            <p className="rounded-xl border border-gold/20 bg-gold/8 px-4 py-3 text-sm text-hero-text/80">
              Meta configurada:{' '}
              <span className="font-semibold text-gold-light">{previewAmount}</span>
            </p>
          ) : null}

          <Field label="Nota opcional">
            <textarea
              value={description}
              maxLength={200}
              rows={3}
              placeholder="Ej. Meta comercial del mes para el equipo"
              className={cn(inputClassName, 'resize-none')}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          {error ? <ErrorBox message={error} /> : null}
        </div>

        <ModalActions saving={saving} onClose={onClose} saveLabel="Guardar objetivo" />
      </form>
    </ModalShell>
  )
}

type SalesReportModalProps = {
  open: boolean
  currency: SalesGoalCurrency
  saving?: boolean
  onClose: () => void
  onSubmit: (input: { amount: number; note?: string | null }) => Promise<void>
}

export function SalesReportModal({
  open,
  currency,
  saving = false,
  onClose,
  onSubmit,
}: SalesReportModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setAmount('')
    setNote('')
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const parsedAmount = Number(amount.replace(',', '.'))

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Introduce un importe vendido válido mayor que cero.')
      return
    }

    try {
      await onSubmit({
        amount: parsedAmount,
        note: note.trim() || null,
      })
      onClose()
    } catch {
      setError(SALES_GOAL_COPY.reportError)
    }
  }

  return (
    <ModalShell
      title="Reportar venta"
      description="Comparte una venta para que el líder la valide y sume al objetivo del equipo."
      onClose={onClose}
      disabled={saving}
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void handleSubmit(event)}>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <Field label={`Importe vendido (${currency})`}>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              placeholder="250"
              className={inputClassName}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>

          <Field label="Nota opcional">
            <textarea
              value={note}
              maxLength={200}
              rows={3}
              placeholder="Ej. Venta de producto premium"
              className={cn(inputClassName, 'resize-none')}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>

          {error ? <ErrorBox message={error} /> : null}
        </div>

        <ModalActions saving={saving} onClose={onClose} saveLabel="Enviar reporte" />
      </form>
    </ModalShell>
  )
}

function ModalShell({
  title,
  description,
  onClose,
  disabled = false,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] min-h-[100dvh]">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-petrol-deep/75 backdrop-blur-sm"
        aria-label="Cerrar modal"
        disabled={disabled}
        onClick={disabled ? undefined : onClose}
      />

      <div className="relative flex h-full min-h-[100dvh] items-end justify-center p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sales-goal-modal-title"
          className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-2xl"
        >
          <div className="shrink-0 border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/80">
                  {SALES_GOAL_COPY.title}
                </p>
                <h2 id="sales-goal-modal-title" className="mt-1 text-lg font-semibold text-hero-text">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 text-sm leading-relaxed text-hero-text/70">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-white/15 p-2 text-hero-text/70 transition hover:bg-white/10"
                aria-label="Cerrar"
                disabled={disabled}
                onClick={onClose}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-hero-text">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

const inputClassName =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text placeholder:text-hero-text/40 focus:border-teal-accent/40 focus:outline-none focus:ring-2 focus:ring-teal-accent/20'

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </p>
  )
}

function ModalActions({
  saving,
  onClose,
  saveLabel,
}: {
  saving: boolean
  onClose: () => void
  saveLabel: string
}) {
  return (
    <div className="shrink-0 border-t border-white/10 bg-petrol-deep/95 px-5 py-4 sm:px-6">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
          disabled={saving}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-gold text-petrol-deep hover:bg-gold-light"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </div>
    </div>
  )
}
