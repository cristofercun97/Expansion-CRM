import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import type { BusySlot } from '@/features/agenda/utils/agendaScheduleUtils'
import { formatMeetingTime } from '@/features/agenda/utils/meetingDateUtils'

type ConflictAvailabilityPanelProps = {
  organizerId: string
  startAt: Date | null
  endAt: Date | null
  ignoreMeetingId?: string | null
  acknowledgeConflicts: boolean
  onAcknowledgeChange: (value: boolean) => void
}

export function ConflictAvailabilityPanel({
  organizerId,
  startAt,
  endAt,
  ignoreMeetingId,
  acknowledgeConflicts,
  onAcknowledgeChange,
}: ConflictAvailabilityPanelProps) {
  const [conflicts, setConflicts] = useState<Meeting[]>([])
  const [busy, setBusy] = useState<BusySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [showAvailability, setShowAvailability] = useState(false)
  const [error, setError] = useState('')
  const startMs = startAt?.getTime() ?? null
  const endMs = endAt?.getTime() ?? null

  useEffect(() => {
    if (!organizerId || startMs == null || endMs == null) {
      return
    }
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      setLoading(true)
      setError('')
      try {
        const items = await meetingsService.findOrganizerScheduleConflicts({
          organizerId,
          startAt: new Date(startMs),
          endAt: new Date(endMs),
          ignoreMeetingId,
        })
        if (cancelled) return
        setConflicts(items)
        if (items.length === 0) onAcknowledgeChange(false)
      } catch (err) {
        if (cancelled) return
        setConflicts([])
        setError(err instanceof Error ? err.message : 'No pudimos comprobar conflictos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [organizerId, startMs, endMs, ignoreMeetingId, onAcknowledgeChange])

  async function loadAvailability() {
    if (!organizerId || startMs == null) return
    setShowAvailability(true)
    setLoading(true)
    try {
      const slots = await meetingsService.listOrganizerBusySlotsForDay({
        organizerId,
        day: new Date(startMs),
      })
      setBusy(slots)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar disponibilidad.')
      setBusy([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-petrol-dark/10 bg-petrol-dark/[0.03] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-dark">Horario</p>
        <Button type="button" variant="ghost" className="min-h-9 text-sm" onClick={() => void loadAvailability()}>
          Ver disponibilidad
        </Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-text-soft">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Comprobando agenda...
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {conflicts.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">Tienes otra reunión en este horario.</p>
          <ul className="mt-1 space-y-1 text-xs">
            {conflicts.map((meeting) => (
              <li key={meeting.id}>
                {meeting.title} · {formatMeetingTime(meeting.startAt)}–{formatMeetingTime(meeting.endAt)}
              </li>
            ))}
          </ul>
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={acknowledgeConflicts}
              onChange={(event) => onAcknowledgeChange(event.target.checked)}
            />
            Continuar de todas formas
          </label>
        </div>
      ) : null}

      {showAvailability ? (
        <div className="text-xs text-text-soft">
          <p className="mb-1 font-medium text-text-dark">Ocupado este día</p>
          {busy.length === 0 ? (
            <p>Sin reuniones ocupadas.</p>
          ) : (
            <ul className="space-y-1">
              {busy.map((slot) => (
                <li key={slot.meetingId}>
                  {formatMeetingTime(slot.startAt)}–{formatMeetingTime(slot.endAt)} Ocupado
                  {slot.title ? ` · ${slot.title}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
