import { CalendarClock, MapPin, Users, Video } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import {
  formatMeetingDate,
  formatMeetingTime,
  timestampToDate,
} from '@/features/agenda/utils/meetingDateUtils'
import { getMeetingStatusLabel, getMeetingTypeLabel } from '@/features/agenda/utils/meetingLabels'
import { getMeetingJoinInfo, getMeetingModeLabel } from '@/features/agenda/utils/meetingModeUtils'
import { cn } from '@/lib/utils'

type MeetingCardProps = {
  meeting: Meeting
  currentUserId: string
  onOpen: (meeting: Meeting) => void
}

export function MeetingCard({ meeting, currentUserId, onOpen }: MeetingCardProps) {
  const start = timestampToDate(meeting.startAt)
  const participantNames = meeting.participants
    .slice(0, 3)
    .map((participant) => participant.name)
    .join(', ')
  const isOrganizer = meeting.organizerId === currentUserId
  const join = getMeetingJoinInfo(meeting)

  return (
    <article
      className={cn(
        'rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.18)]',
        'backdrop-blur-xl transition-colors hover:border-gold/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gold-light">
            {getMeetingTypeLabel(meeting.type)} · {getMeetingModeLabel(meeting)}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-hero-text">{meeting.title}</h3>
          {meeting.meetingAudience === 'group' && meeting.groupNameSnapshot ? (
            <p className="mt-1 text-xs text-hero-text/55">Grupo · {meeting.groupNameSnapshot}</p>
          ) : null}
          {!isOrganizer ? (
            <p className="mt-1 text-xs text-hero-text/55">
              Organizada por {meeting.organizerName || 'un miembro de EXPANSIÓN'}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-hero-text/75">
          {getMeetingStatusLabel(meeting.status)}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-hero-text/75">
        <p className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-teal-accent" aria-hidden="true" />
          <span>
            {formatMeetingDate(start)} · {formatMeetingTime(start)} · {meeting.durationMinutes} min
          </span>
        </p>
        {meeting.meetingMode === 'in_person' && meeting.location ? (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            <span className="truncate">{meeting.location}</span>
          </p>
        ) : null}
        {participantNames ? (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-accent" aria-hidden="true" />
            <span className="truncate">{participantNames}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/20 bg-white/5 text-hero-text hover:bg-white/10"
          onClick={() => onOpen(meeting)}
        >
          Ver detalle
        </Button>
        {join && meeting.status === 'scheduled' ? (
          <a
            href={join.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-accent/15 px-3 text-sm font-medium text-teal-accent transition-colors hover:bg-teal-accent/25"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            {join.cta}
          </a>
        ) : null}
      </div>
    </article>
  )
}
