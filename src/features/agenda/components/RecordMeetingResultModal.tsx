import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button, Textarea } from '@/components/ui'
import type { Meeting, RecordMeetingResultInput } from '@/features/agenda/types/meeting.types'
import { meetingsService } from '@/features/agenda/services/meetings.service'

type RecordMeetingResultModalProps = {
  meeting: Meeting | null
  organizerId: string
  onClose: () => void
  onSaved: (meeting: Meeting) => void
}

type Outcome = RecordMeetingResultInput['outcome']

export function RecordMeetingResultModal({
  meeting,
  organizerId,
  onClose,
  onSaved,
}: RecordMeetingResultModalProps) {
  const [outcome, setOutcome] = useState<Outcome>('completed')
  const [resultNotes, setResultNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sourceId, setSourceId] = useState(meeting?.id ?? null)

  if (meeting && meeting.id !== sourceId) {
    setSourceId(meeting.id)
    setOutcome('completed')
    setResultNotes('')
    setError('')
  }

  useEffect(() => {
    if (!meeting) {
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
  }, [meeting, onClose])

  if (!meeting) {
    return null
  }

  const activeMeeting = meeting

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) {
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const updated = await meetingsService.recordMeetingResult(activeMeeting.id, organizerId, {
        outcome,
        resultNotes,
        cancelReason: outcome === 'cancelled' ? resultNotes : undefined,
      })
      onSaved(updated)
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos registrar el resultado.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Cerrar resultado"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-result-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/12 bg-petrol-deep p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="record-result-title" className="text-lg font-semibold text-hero-text">
              Registrar resultado
            </h2>
            <p className="mt-1 text-sm text-hero-text/65">{activeMeeting.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/60 hover:bg-white/5"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-hero-text">Resultado</legend>
            {(
              [
                { id: 'completed', label: 'Realizada' },
                { id: 'no_show', label: 'No asistió' },
                { id: 'cancelled', label: 'Cancelada' },
              ] as const
            ).map((option) => (
              <label
                key={option.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-hero-text"
              >
                <input
                  type="radio"
                  name="meeting-outcome"
                  checked={outcome === option.id}
                  onChange={() => setOutcome(option.id)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <Textarea
            label={
              outcome === 'completed'
                ? 'Resumen / resultado'
                : outcome === 'cancelled'
                  ? 'Motivo (opcional)'
                  : 'Notas (opcional)'
            }
            value={resultNotes}
            onChange={(event) => setResultNotes(event.target.value)}
            className="min-h-24 border-white/15 bg-white/10 text-hero-text"
            placeholder={
              outcome === 'completed'
                ? 'María revisará los contactos y realizará seguimiento antes del viernes.'
                : 'Añade contexto si lo necesitas'
            }
          />

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-petrol-deep hover:bg-gold-light"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              'Guardar resultado'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
