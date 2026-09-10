import { CalendarDays, MapPin, Plus, Users, Video, X } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  formatDayHeading,
  formatStatusLabel,
  MODE_SHORT_LABEL,
  statusChipClass,
} from '@/features/agenda/utils/agendaCalendarUi'
import { formatMeetingTime, timestampToDate } from '@/features/agenda/utils/meetingDateUtils'
import { cn } from '@/lib/utils'

type PersonalProps = {
  mode: 'personal'
  meetings: Meeting[]
  onOpenMeeting: (meeting: Meeting) => void
}

type TeamProps = {
  mode: 'team'
  slots: TeamAgendaSlot[]
  memberNameByUid: Map<string, string>
  resolveAccessibleMeeting: (slot: TeamAgendaSlot) => Meeting | null
  onOpenMeeting: (meeting: Meeting) => void
}

export type AgendaDayDetailsPanelProps = {
  open: boolean
  day: Date
  onClose: () => void
  onCreateForDay?: () => void
  variant?: 'sidebar' | 'sheet'
} & (PersonalProps | TeamProps)

export function AgendaDayDetailsPanel(props: AgendaDayDetailsPanelProps) {
  const { open, day, onClose, onCreateForDay, variant = 'sidebar' } = props
  if (!open) return null

  const count =
    props.mode === 'personal' ? props.meetings.length : props.slots.length

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight text-hero-text">
            {formatDayHeading(day)}
          </h3>
          <p className="mt-0.5 text-xs text-hero-text/55">
            {count === 0
              ? 'Sin reuniones'
              : `${count} reunión${count === 1 ? '' : 'es'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-hero-text/60 hover:bg-white/5 hover:text-hero-text"
          aria-label="Cerrar detalle del día"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {props.mode === 'personal' ? (
          props.meetings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Día libre"
              description="No hay reuniones en este día. Agenda una conversación o elige otro día."
              className="border-white/10 bg-white/[0.03] [&_h3]:text-hero-text [&_p]:text-hero-text/65"
            />
          ) : (
            <ul className="space-y-2">
              {props.meetings.map((meeting) => {
                const start = timestampToDate(meeting.startAt)
                return (
                  <li key={meeting.id}>
                    <button
                      type="button"
                      onClick={() => props.onOpenMeeting(meeting)}
                      className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition-colors hover:border-gold/30 hover:bg-white/[0.07]"
                    >
                      <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-gold-light">
                        {formatMeetingTime(start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-hero-text">
                          {meeting.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-hero-text/55">
                          <span className="inline-flex items-center gap-1">
                            {meeting.meetingMode === 'video' ? (
                              <Video className="h-3 w-3" />
                            ) : meeting.meetingMode === 'in_person' ? (
                              <MapPin className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {MODE_SHORT_LABEL[meeting.meetingMode] || 'Otra'}
                          </span>
                          {meeting.meetingAudience === 'group' && meeting.groupNameSnapshot ? (
                            <span className="truncate">· {meeting.groupNameSnapshot}</span>
                          ) : null}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          statusChipClass(meeting.status),
                        )}
                      >
                        {formatStatusLabel(meeting.status)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )
        ) : props.slots.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin ocupación"
            description="No hay reuniones del equipo en este día."
            className="border-white/10 bg-white/[0.03] [&_h3]:text-hero-text [&_p]:text-hero-text/65"
          />
        ) : (
          <ul className="space-y-2">
            {props.slots.map((slot) => {
              const accessible = props.resolveAccessibleMeeting(slot)
              const title = accessible
                ? accessible.title
                : slot.busy
                  ? 'Ocupado'
                  : 'Reunión'
              const memberName = props.memberNameByUid.get(slot.memberUid) || 'Miembro'
              return (
                <li key={`${slot.meetingId}-${slot.memberUid}`}>
                  <button
                    type="button"
                    disabled={!accessible}
                    onClick={() => {
                      if (accessible) props.onOpenMeeting(accessible)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left',
                      accessible
                        ? 'hover:border-gold/30 hover:bg-white/[0.07]'
                        : 'cursor-default opacity-90',
                    )}
                  >
                    <span className="w-12 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-gold-light">
                      {new Date(slot.startAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-hero-text">
                        {memberName}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-hero-text/55">
                        {title} · {MODE_SHORT_LABEL[slot.meetingMode] || 'Otra'}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        statusChipClass(slot.status),
                      )}
                    >
                      {formatStatusLabel(slot.status)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {onCreateForDay && props.mode === 'personal' ? (
        <div className="border-t border-white/10 p-3">
          <Button
            type="button"
            variant="outline"
            className="w-full border-gold/40 bg-transparent text-gold-light hover:bg-gold/10"
            onClick={onCreateForDay}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva reunión en este día
          </Button>
        </div>
      ) : null}
    </>
  )

  if (variant === 'sheet') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          aria-label="Cerrar detalle del día"
          onClick={onClose}
        />
        <div className="relative z-10 flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-petrol-deep shadow-2xl">
          {body}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] shadow-[0_12px_40px_rgba(0,0,0,0.22)] lg:flex">
      {body}
    </aside>
  )
}
