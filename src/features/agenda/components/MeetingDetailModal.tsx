import { useEffect, useState } from 'react'
import { Loader2, Video, X } from 'lucide-react'
import { Button, Textarea } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import { meetingsService } from '@/features/agenda/services/meetings.service'
import { canManageMeeting } from '@/features/agenda/utils/meetingAccess'
import { formatMeetingDateTimeRange } from '@/features/agenda/utils/meetingDateUtils'
import { getMeetingStatusLabel, getMeetingTypeLabel } from '@/features/agenda/utils/meetingLabels'
import { getMeetingJoinInfo, getMeetingModeLabel } from '@/features/agenda/utils/meetingModeUtils'

type MeetingDetailModalProps = {
  meeting: Meeting | null
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onEdit: (meeting: Meeting) => void
  onChanged: (meeting: Meeting) => void
}

export function MeetingDetailModal({
  meeting,
  currentUserId,
  isAdmin,
  onClose,
  onEdit,
  onChanged,
}: MeetingDetailModalProps) {
  const [resultNotes, setResultNotes] = useState(meeting?.resultNotes ?? '')
  const [notesSourceId, setNotesSourceId] = useState(meeting?.id ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const meetingId = meeting?.id ?? null
  if (meetingId !== notesSourceId) {
    setNotesSourceId(meetingId)
    setResultNotes(meeting?.resultNotes ?? '')
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

  const canManage = canManageMeeting({
    meetingOrganizerId: meeting.organizerId,
    currentUserId,
    isAdmin,
  })
  const isOrganizer = meeting.organizerId === currentUserId
  const join = getMeetingJoinInfo(meeting)

  async function runAction(action: () => Promise<Meeting>) {
    setBusy(true)
    setError('')
    try {
      const updated = await action()
      onChanged(updated)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'No pudimos actualizar la reunión.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-detail-title"
        className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/12 bg-petrol-deep p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gold-light">
              {getMeetingTypeLabel(meeting.type)} · {getMeetingModeLabel(meeting)} ·{' '}
              {getMeetingStatusLabel(meeting.status)}
            </p>
            <h2 id="meeting-detail-title" className="mt-1 text-xl font-semibold text-hero-text">
              {meeting.title}
            </h2>
            <p className="mt-2 text-sm text-hero-text/70">
              {formatMeetingDateTimeRange(meeting.startAt, meeting.endAt)}
              {' · '}
              {meeting.durationMinutes} min
            </p>
            {!isOrganizer ? (
              <p className="mt-2 text-sm text-hero-text/65">
                Organizada por {meeting.organizerName || 'un miembro de EXPANSIÓN'}
              </p>
            ) : null}
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

        <div className="mt-5 space-y-3 text-sm text-hero-text/80">
          {meeting.description ? (
            <p>
              <span className="font-medium text-hero-text">Objetivo:</span> {meeting.description}
            </p>
          ) : null}
          {meeting.notes ? (
            <p>
              <span className="font-medium text-hero-text">Notas previas:</span> {meeting.notes}
            </p>
          ) : null}
          <div>
            <p className="font-medium text-hero-text">Participantes</p>
            <ul className="mt-1 space-y-1">
              {meeting.participants.length === 0 ? (
                <li className="text-hero-text/55">Sin participantes añadidos</li>
              ) : (
                meeting.participants.map((participant, index) => (
                  <li key={`${participant.name}-${index}`}>
                    {participant.name}
                    {participant.email ? ` · ${participant.email}` : ''}
                    <span className="text-hero-text/45"> · {participant.type}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          {meeting.meetingMode === 'in_person' && meeting.location ? (
            <p>
              <span className="font-medium text-hero-text">Ubicación:</span> {meeting.location}
            </p>
          ) : null}
          {join ? (
            <a
              href={join.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-accent/15 px-4 text-sm font-semibold text-teal-accent hover:bg-teal-accent/25"
            >
              <Video className="h-4 w-4" />
              {join.cta}
            </a>
          ) : meeting.meetingMode === 'video' ? (
            <p className="text-hero-text/55">Esta videollamada no tiene enlace todavía.</p>
          ) : meeting.meetingMode === 'in_person' ? (
            <p className="text-hero-text/55">Reunión presencial{meeting.location ? '' : '.'}</p>
          ) : null}
        </div>

        {canManage && meeting.status === 'scheduled' ? (
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <Textarea
              label="Resultado / notas"
              placeholder="¿Qué ocurrió en la reunión?"
              value={resultNotes}
              onChange={(event) => setResultNotes(event.target.value)}
              className="min-h-24 border-white/15 bg-white/10 text-hero-text"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => onEdit(meeting)}
                className="bg-gold text-petrol-deep hover:bg-gold-light"
              >
                Editar / reprogramar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runAction(() =>
                    meetingsService.completeMeeting(
                      meeting.id,
                      meeting.organizerId,
                      resultNotes,
                      'completed',
                    ),
                  )
                }
                className="bg-teal-accent/20 text-teal-accent hover:bg-teal-accent/30"
              >
                Marcar como realizada
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(() =>
                    meetingsService.completeMeeting(
                      meeting.id,
                      meeting.organizerId,
                      resultNotes,
                      'no_show',
                    ),
                  )
                }
                className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
              >
                No asistió
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void runAction(() =>
                    meetingsService.cancelMeeting(meeting.id, meeting.organizerId),
                  )
                }
                className="border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/15"
              >
                Cancelar reunión
              </Button>
            </div>
          </div>
        ) : null}

        {!canManage ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
            Estás invitado como participante. Puedes consultar el detalle y entrar a Meet.
            Solo el organizador puede editar o marcar el resultado.
          </p>
        ) : null}

        {meeting.resultNotes ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/80">
            <span className="font-medium text-hero-text">Resultado:</span> {meeting.resultNotes}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {busy ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-hero-text/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando...
          </p>
        ) : null}
      </div>
    </div>
  )
}
