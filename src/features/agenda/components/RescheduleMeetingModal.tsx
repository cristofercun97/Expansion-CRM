import { useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import { ConflictAvailabilityPanel } from '@/features/agenda/components/ConflictAvailabilityPanel'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import {
  addMinutes,
  combineLocalDateAndTime,
  formatMeetingDateTimeRange,
  getBrowserTimezone,
  timestampToDate,
  toDateInputValue,
  toTimeInputValue,
} from '@/features/agenda/utils/meetingDateUtils'
import { MEETING_DURATION_OPTIONS } from '@/features/agenda/utils/meetingLabels'

function resolveRescheduleDuration(durationMinutes: number, customDurationMinutes: string): number {
  if ((MEETING_DURATION_OPTIONS as readonly number[]).includes(durationMinutes)) {
    return durationMinutes
  }
  const custom = Number(customDurationMinutes)
  return Number.isFinite(custom) ? custom : NaN
}

type RescheduleMeetingModalProps = {
  meeting: Meeting | null
  organizerId: string
  onClose: () => void
  onSaved: (meeting: Meeting) => void
}

export function RescheduleMeetingModal({
  meeting,
  organizerId,
  onClose,
  onSaved,
}: RescheduleMeetingModalProps) {
  const start = meeting ? timestampToDate(meeting.startAt) : null
  const [date, setDate] = useState(start ? toDateInputValue(start) : '')
  const [time, setTime] = useState(start ? toTimeInputValue(start) : '')
  const [durationMinutes, setDurationMinutes] = useState(meeting?.durationMinutes ?? 30)
  const [customDurationMinutes, setCustomDurationMinutes] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sourceId, setSourceId] = useState(meeting?.id ?? null)
  const [acknowledgeConflicts, setAcknowledgeConflicts] = useState(false)

  const conflictWindow = useMemo(() => {
    const startAt = combineLocalDateAndTime(date, time)
    const duration = resolveRescheduleDuration(durationMinutes, customDurationMinutes)
    if (!startAt || !Number.isFinite(duration) || duration < 5) {
      return { startAt: null as Date | null, endAt: null as Date | null }
    }
    return { startAt, endAt: addMinutes(startAt, duration) }
  }, [date, time, durationMinutes, customDurationMinutes])

  if (meeting && meeting.id !== sourceId) {
    const nextStart = timestampToDate(meeting.startAt)
    setSourceId(meeting.id)
    setDate(nextStart ? toDateInputValue(nextStart) : '')
    setTime(nextStart ? toTimeInputValue(nextStart) : '')
    setDurationMinutes(meeting.durationMinutes)
    setCustomDurationMinutes('')
    setReason('')
    setError('')
    setAcknowledgeConflicts(false)
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

    const startAt = combineLocalDateAndTime(date, time)
    if (!startAt) {
      setError('Fecha u hora no válidas.')
      return
    }

    const duration = resolveRescheduleDuration(durationMinutes, customDurationMinutes)

    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      setError('La duración debe estar entre 5 y 480 minutos.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (conflictWindow.startAt && conflictWindow.endAt) {
        const conflicts = await meetingsService.findOrganizerScheduleConflicts({
          organizerId,
          startAt: conflictWindow.startAt,
          endAt: conflictWindow.endAt,
          ignoreMeetingId: activeMeeting.id,
        })
        if (conflicts.length > 0 && !acknowledgeConflicts) {
          setError(
            'Tienes otra reunión en este horario. Cambia la hora o marca “Continuar de todas formas”.',
          )
          setSubmitting(false)
          return
        }
      }

      const updated = await meetingsService.rescheduleMeeting(activeMeeting.id, organizerId, {
        startAt,
        durationMinutes: duration,
        timezone: activeMeeting.timezone || getBrowserTimezone(),
        reason,
      })
      onSaved(updated)
      onClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No pudimos reprogramar la reunión.',
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
        aria-label="Cerrar reprogramación"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-meeting-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/12 bg-petrol-deep p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reschedule-meeting-title" className="text-lg font-semibold text-hero-text">
              Reprogramar reunión
            </h2>
            <p className="mt-1 text-sm text-hero-text/65">
              Actual: {formatMeetingDateTimeRange(activeMeeting.startAt, activeMeeting.endAt)}
            </p>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-hero-text/80" htmlFor="reschedule-date">
                Nueva fecha
              </label>
              <Input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="border-white/15 bg-white/10 text-hero-text"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-hero-text/80" htmlFor="reschedule-time">
                Nueva hora
              </label>
              <Input
                id="reschedule-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="border-white/15 bg-white/10 text-hero-text"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-hero-text/80" htmlFor="reschedule-duration">
              Duración
            </label>
            <select
              id="reschedule-duration"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-hero-text"
            >
              {MEETING_DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutos
                </option>
              ))}
              <option value={0}>Personalizada</option>
            </select>
            {durationMinutes === 0 ? (
              <Input
                className="mt-2 border-white/15 bg-white/10 text-hero-text"
                type="number"
                min={5}
                max={480}
                value={customDurationMinutes}
                onChange={(event) => setCustomDurationMinutes(event.target.value)}
                placeholder="Minutos"
              />
            ) : null}
          </div>

          <ConflictAvailabilityPanel
            organizerId={organizerId}
            startAt={conflictWindow.startAt}
            endAt={conflictWindow.endAt}
            ignoreMeetingId={activeMeeting.id}
            acknowledgeConflicts={acknowledgeConflicts}
            onAcknowledgeChange={setAcknowledgeConflicts}
          />

          <Textarea
            label="Motivo (opcional)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-20 border-white/15 bg-white/10 text-hero-text"
            placeholder="Ej. El contacto pidió mover la llamada"
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
                Confirmando...
              </span>
            ) : (
              'Confirmar reprogramación'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
