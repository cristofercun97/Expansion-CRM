import { CalendarClock } from 'lucide-react'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import { getMeetingStatusLabel } from '@/features/agenda/utils/meetingLabels'
import { cn } from '@/lib/utils'

const MODE_LABELS: Record<string, string> = {
  video: 'Video',
  in_person: 'Presencial',
  other: 'Otra',
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${fmt.format(start)}–${fmt.format(end)}`
}

type TeamBusySlotCardProps = {
  slot: TeamAgendaSlot
  memberName: string
  accessibleMeeting: Meeting | null
  onOpenAccessible?: (meeting: Meeting) => void
}

export function TeamBusySlotCard({
  slot,
  memberName,
  accessibleMeeting,
  onOpenAccessible,
}: TeamBusySlotCardProps) {
  const modeLabel = MODE_LABELS[slot.meetingMode] || 'Otra'
  const statusLabel = getMeetingStatusLabel(
    slot.status as Meeting['status'],
  )
  const canOpen = Boolean(accessibleMeeting && onOpenAccessible)

  return (
    <article
      className={cn(
        'rounded-2xl border border-white/12 bg-white/6 p-3',
        canOpen && 'cursor-pointer hover:border-gold/25',
      )}
      onClick={() => {
        if (accessibleMeeting && onOpenAccessible) onOpenAccessible(accessibleMeeting)
      }}
      onKeyDown={(event) => {
        if (!canOpen) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (accessibleMeeting && onOpenAccessible) onOpenAccessible(accessibleMeeting)
        }
      }}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-hero-text">{memberName}</p>
          <p className="mt-0.5 text-xs text-hero-text/55">
            {accessibleMeeting ? accessibleMeeting.title : slot.busy ? 'Ocupado' : 'Reunión'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-hero-text/75">
          {slot.busy ? 'Ocupado' : statusLabel}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm text-hero-text/75">
        <CalendarClock className="h-4 w-4 text-teal-accent" aria-hidden="true" />
        <span>
          {formatTimeRange(slot.startAt, slot.endAt)} · {modeLabel} · {statusLabel}
        </span>
      </p>
    </article>
  )
}
