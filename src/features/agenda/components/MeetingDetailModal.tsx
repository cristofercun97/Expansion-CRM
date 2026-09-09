import { useEffect, useMemo, useState } from 'react'
import { Video, X } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import { canManageMeeting } from '@/features/agenda/utils/meetingAccess'
import { formatMeetingDateTimeRange } from '@/features/agenda/utils/meetingDateUtils'
import { getMeetingStatusLabel, getMeetingTypeLabel } from '@/features/agenda/utils/meetingLabels'
import { getMeetingJoinInfo, getMeetingModeLabel } from '@/features/agenda/utils/meetingModeUtils'
import { RECURRENCE_FREQUENCY_LABELS } from '@/features/agenda/utils/recurrenceUtils'

const PARTICIPANT_PREVIEW_LIMIT = 5

type MeetingDetailModalProps = {
  meeting: Meeting | null
  currentUserId: string
  isAdmin: boolean
  onClose: () => void
  onEdit: (meeting: Meeting) => void
  onReschedule: (meeting: Meeting) => void
  onRecordResult: (meeting: Meeting) => void
  onCreateNextAction?: (meeting: Meeting) => void
  onChanged: (meeting: Meeting) => void
}

export function MeetingDetailModal({
  meeting,
  currentUserId,
  isAdmin,
  onClose,
  onEdit,
  onReschedule,
  onRecordResult,
  onCreateNextAction,
}: MeetingDetailModalProps) {
  const [showAllParticipants, setShowAllParticipants] = useState(false)
  const [sourceId, setSourceId] = useState(meeting?.id ?? null)

  if (meeting && meeting.id !== sourceId) {
    setSourceId(meeting.id)
    setShowAllParticipants(false)
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

  const visibleParticipants = useMemo(() => {
    if (!meeting) {
      return []
    }
    if (showAllParticipants) {
      return meeting.participants
    }
    return meeting.participants.slice(0, PARTICIPANT_PREVIEW_LIMIT)
  }, [meeting, showAllParticipants])

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
  const hiddenParticipants = Math.max(0, meeting.participants.length - PARTICIPANT_PREVIEW_LIMIT)

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
            {meeting.recurrenceSeriesId ? (
              <p className="mt-2 text-sm text-hero-text/70">
                ↻ Recurrente
                {meeting.recurrenceFrequency
                  ? ` · ${RECURRENCE_FREQUENCY_LABELS[meeting.recurrenceFrequency]}`
                  : ''}
              </p>
            ) : null}
            {meeting.meetingAudience === 'group' && meeting.groupNameSnapshot ? (
              <p className="mt-2 text-sm text-hero-text/70">
                Grupo: <span className="font-medium text-hero-text">{meeting.groupNameSnapshot}</span>
              </p>
            ) : null}
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
                visibleParticipants.map((participant, index) => (
                  <li key={`${participant.name}-${index}`}>
                    {participant.name}
                    {participant.email ? ` · ${participant.email}` : ''}
                    <span className="text-hero-text/45"> · {participant.type}</span>
                  </li>
                ))
              )}
            </ul>
            {!showAllParticipants && hiddenParticipants > 0 ? (
              <button
                type="button"
                className="mt-2 text-sm font-medium text-teal-accent hover:underline"
                onClick={() => setShowAllParticipants(true)}
              >
                +{hiddenParticipants} participantes · Ver participantes
              </button>
            ) : null}
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

          {(meeting.status === 'scheduled' || meeting.status === 'rescheduled') ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gold-light">
                Recordatorios
              </p>
              <ul className="mt-2 space-y-1 text-sm text-hero-text/75">
                <li>✓ 24h</li>
                <li>✓ 1h</li>
                <li>✓ 10 min</li>
              </ul>
              <p className="mt-2 text-[11px] text-hero-text/45">
                Se programan automáticamente según la hora de inicio.
              </p>
            </div>
          ) : null}
        </div>

        {canManage && meeting.status === 'scheduled' ? (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <Button
              type="button"
              size="sm"
              onClick={() => onEdit(meeting)}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onReschedule(meeting)}
              className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
            >
              Reprogramar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onRecordResult(meeting)}
              className="bg-teal-accent/20 text-teal-accent hover:bg-teal-accent/30"
            >
              Registrar resultado
            </Button>
          </div>
        ) : null}

        {canManage && meeting.status === 'completed' ? (
          <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-hero-text">¿Cuál es el siguiente paso?</p>
            {meeting.nextActionTaskId ? (
              <p className="text-sm text-hero-text/65">
                Ya creaste una próxima acción para esta reunión.
              </p>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => onCreateNextAction?.(meeting)}
                className="bg-gold text-petrol-deep hover:bg-gold-light"
              >
                + Crear próxima acción
              </Button>
            )}
          </div>
        ) : null}

        {!canManage ? (
          <p className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/70">
            Estás invitado como participante. Puedes consultar el detalle y entrar a la reunión.
            Solo el organizador puede editar, reprogramar o registrar el resultado.
          </p>
        ) : null}

        {meeting.resultNotes ? (
          <p className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/80">
            <span className="font-medium text-hero-text">Resultado:</span> {meeting.resultNotes}
          </p>
        ) : null}
      </div>
    </div>
  )
}
