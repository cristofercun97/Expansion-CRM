import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { MeetingCard } from '@/features/agenda/components/MeetingCard'
import { TeamBusySlotCard } from '@/features/agenda/components/TeamBusySlotCard'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  AGENDA_DAY_HOURS,
  AGENDA_GRID_END_HOUR,
  AGENDA_GRID_START_HOUR,
  AGENDA_HOUR_PX,
  blockStyleForRange,
  formatDayHeading,
  statusBlockClass,
} from '@/features/agenda/utils/agendaCalendarUi'
import { addMinutes, timestampToDate } from '@/features/agenda/utils/meetingDateUtils'
import { cn } from '@/lib/utils'

type PersonalProps = {
  mode: 'personal'
  meetings: Meeting[]
  currentUserId: string
  onOpenMeeting: (meeting: Meeting) => void
}

type TeamProps = {
  mode: 'team'
  slots: TeamAgendaSlot[]
  memberNameByUid: Map<string, string>
  resolveAccessibleMeeting: (slot: TeamAgendaSlot) => Meeting | null
  onOpenMeeting: (meeting: Meeting) => void
}

export type AgendaCalendarDayViewProps = {
  day: Date
} & (PersonalProps | TeamProps)

export function AgendaCalendarDayView(props: AgendaCalendarDayViewProps) {
  const { day } = props
  const gridHeight = (AGENDA_GRID_END_HOUR - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX
  const count = props.mode === 'personal' ? props.meetings.length : props.slots.length

  if (count === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Sin reuniones este día"
        description="Elige otro día o crea una nueva reunión para mantener el ritmo."
        className="border-white/15 bg-white/5 [&_h3]:text-hero-text [&_p]:text-hero-text/70"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-light/80">
            Vista día
          </p>
          <h3 className="mt-1 text-xl font-semibold text-hero-text">{formatDayHeading(day)}</h3>
        </div>
        <p className="text-sm text-hero-text/55">
          {count} reunión{count === 1 ? '' : 'es'}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="grid grid-cols-[56px_minmax(0,1fr)]">
          <div className="relative border-r border-white/8" style={{ height: gridHeight }}>
            {AGENDA_DAY_HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-1.5 -translate-y-1/2 text-[11px] tabular-nums text-hero-text/40"
                style={{ top: (hour - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: gridHeight }}>
            {AGENDA_DAY_HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-white/[0.06]"
                style={{ top: (hour - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX }}
              />
            ))}

            {props.mode === 'personal'
              ? props.meetings.map((meeting) => {
                  const start = timestampToDate(meeting.startAt)
                  if (!start) return null
                  const end =
                    timestampToDate(meeting.endAt) ||
                    addMinutes(start, meeting.durationMinutes || 30)
                  const style = blockStyleForRange(start, end)
                  return (
                    <button
                      key={meeting.id}
                      type="button"
                      onClick={() => props.onOpenMeeting(meeting)}
                      className={cn(
                        'absolute left-2 right-2 overflow-hidden rounded-xl border px-3 py-2 text-left shadow-sm',
                        statusBlockClass(meeting.status),
                      )}
                      style={{ top: style.top, height: Math.max(style.height, 44) }}
                    >
                      <span className="text-xs font-semibold text-hero-text/80">
                        {start.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">
                        {meeting.title}
                      </span>
                    </button>
                  )
                })
              : props.slots.map((slot) => {
                  const start = new Date(slot.startAt)
                  const end = new Date(slot.endAt)
                  const style = blockStyleForRange(start, end)
                  const accessible = props.resolveAccessibleMeeting(slot)
                  const label = props.memberNameByUid.get(slot.memberUid) || 'Miembro'
                  return (
                    <button
                      key={`${slot.meetingId}-${slot.memberUid}`}
                      type="button"
                      onClick={() => {
                        if (accessible) props.onOpenMeeting(accessible)
                      }}
                      className={cn(
                        'absolute left-2 right-2 overflow-hidden rounded-xl border px-3 py-2 text-left shadow-sm',
                        statusBlockClass(slot.status),
                      )}
                      style={{ top: style.top, height: Math.max(style.height, 44) }}
                    >
                      <span className="text-xs font-semibold text-hero-text/80">
                        {start.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold">{label}</span>
                    </button>
                  )
                })}
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {props.mode === 'personal'
          ? props.meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                currentUserId={props.currentUserId}
                onOpen={props.onOpenMeeting}
              />
            ))
          : props.slots.map((slot) => (
              <TeamBusySlotCard
                key={`${slot.meetingId}-${slot.memberUid}`}
                slot={slot}
                memberName={props.memberNameByUid.get(slot.memberUid) || 'Miembro'}
                accessibleMeeting={props.resolveAccessibleMeeting(slot)}
                onOpenAccessible={props.onOpenMeeting}
              />
            ))}
      </div>
    </div>
  )
}
