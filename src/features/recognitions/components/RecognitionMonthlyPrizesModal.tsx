import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import type { RecognitionMonthlyPrizes } from '@/features/recognitions/types/recognition-monthly-prizes.types'
import { MONTHLY_PODIUM_PRIZES_COPY } from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

type RecognitionMonthlyPrizesModalProps = {
  open: boolean
  teamId: string
  ownerUid: string
  initialPrizes: RecognitionMonthlyPrizes | null
  saving?: boolean
  onClose: () => void
  onSave: (input: {
    firstPrize: string
    secondPrize: string
    thirdPrize: string
  }) => Promise<void>
}

export function RecognitionMonthlyPrizesModal({
  open,
  teamId,
  ownerUid,
  initialPrizes,
  saving = false,
  onClose,
  onSave,
}: RecognitionMonthlyPrizesModalProps) {
  const [firstPrize, setFirstPrize] = useState('')
  const [secondPrize, setSecondPrize] = useState('')
  const [thirdPrize, setThirdPrize] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setFirstPrize(initialPrizes?.firstPrize ?? '')
    setSecondPrize(initialPrizes?.secondPrize ?? '')
    setThirdPrize(initialPrizes?.thirdPrize ?? '')
    setError('')
  }, [initialPrizes, open])

  if (!open) {
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const normalizedFirst = firstPrize.trim()
    const normalizedSecond = secondPrize.trim()
    const normalizedThird = thirdPrize.trim()

    if (!normalizedFirst && !normalizedSecond && !normalizedThird) {
      setError('Define al menos un premio para el top 3 mensual.')
      return
    }

    try {
      await onSave({
        firstPrize: normalizedFirst,
        secondPrize: normalizedSecond,
        thirdPrize: normalizedThird,
      })
      onClose()
    } catch {
      setError('No se pudieron guardar los premios. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-petrol-deep/70 backdrop-blur-sm"
        aria-label="Cerrar modal"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="monthly-prizes-modal-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/15 bg-petrol-deep/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/80">
              {MONTHLY_PODIUM_PRIZES_COPY.modalEyebrow}
            </p>
            <h2 id="monthly-prizes-modal-title" className="mt-1 text-lg font-semibold text-hero-text">
              {MONTHLY_PODIUM_PRIZES_COPY.modalTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
              {MONTHLY_PODIUM_PRIZES_COPY.modalDescription}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-white/15 p-2 text-hero-text/70 transition hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <PrizeField
            id="first-prize"
            label={MONTHLY_PODIUM_PRIZES_COPY.firstInputLabel}
            value={firstPrize}
            onChange={setFirstPrize}
            placeholder={MONTHLY_PODIUM_PRIZES_COPY.firstInputPlaceholder}
          />
          <PrizeField
            id="second-prize"
            label={MONTHLY_PODIUM_PRIZES_COPY.secondInputLabel}
            value={secondPrize}
            onChange={setSecondPrize}
            placeholder={MONTHLY_PODIUM_PRIZES_COPY.secondInputPlaceholder}
          />
          <PrizeField
            id="third-prize"
            label={MONTHLY_PODIUM_PRIZES_COPY.thirdInputLabel}
            value={thirdPrize}
            onChange={setThirdPrize}
            placeholder={MONTHLY_PODIUM_PRIZES_COPY.thirdInputPlaceholder}
          />

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
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
              disabled={saving || !teamId.trim() || !ownerUid.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                MONTHLY_PODIUM_PRIZES_COPY.saveLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

type PrizeFieldProps = {
  id: string
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}

function PrizeField({ id, label, value, placeholder, onChange }: PrizeFieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-hero-text">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={120}
        placeholder={placeholder}
        className={cn(
          'mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-hero-text',
          'placeholder:text-hero-text/40 focus:border-teal-accent/40 focus:outline-none focus:ring-2 focus:ring-teal-accent/20',
        )}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
