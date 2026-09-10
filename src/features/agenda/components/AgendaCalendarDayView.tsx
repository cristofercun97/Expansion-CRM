import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { MeetingCard } from '@/features/agenda/components/MeetingCard'
import { TeamBusySlotCard } from '@/features/agenda/components/TeamBusySlotCard'
import {
  AgendaTimedEventBlock,
  type TimedEventBlockModel,
} from '@/features/agenda/components/AgendaTimedEventBlock'
import {
  layoutTimedEvents,
  useAgendaOverlapCompact,
} from '@/features/agenda/utils/agendaTimedEventLayout'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  AGENDA_DAY_HOURS,
  AGENDA_GRID_END_HOUR,
  AGENDA_GRID_START_HOUR,
  AGENDA_HOUR_PX,
  formatDayHeading,
} from '@/features/agenda/utils/agendaCalendarUi'
import { addMinutes, timestampToDate } from '@/features/agenda/utils/meetingDateUtils'

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
  const compact = useAgendaOverlapCompact()
  const count = props.mode === 'personal' ? props.meetings.length : props.slots.length

  const timedEvents = useMemo((): TimedEventBlockModel[] => {
    if (props.mode === 'personal') {
      const inputs = props.meetings.flatMap((meeting) => {
        const start = timestampToDate(meeting.startAt)
        if (!start) return []
        const end =
          timestampToDate(meeting.endAt) || addMinutes(start, meeting.durationMinutes || 30)
        return [{ id: meeting.id, startMs: start.getTime(), endMs: end.getTime() }]
      })
      const layouts = layoutTimedEvents(inputs, { compact })
      const byId = new Map(layouts.map((item) => [item.id, item]))
      return props.meetings.flatMap((meeting) => {
        const start = timestampToDate(meeting.startAt)
        const layout = byId.get(meeting.id)
        if (!start || !layout) return []
        return [
          {
            key: meeting.id,
            title: meeting.title,
            status: meeting.status,
            start,
            layout,
            onOpen: () => props.onOpenMeeting(meeting),
          },
        ]
      })
    }

    const inputs = props.slots.map((slot) => ({
      id: `${slot.meetingId}-${slot.memberUid}`,
      startMs: new Date(slot.startAt).getTime(),
      endMs: new Date(slot.endAt).getTime(),
    }))
    const layouts = layoutTimedEvents(inputs, { compact })
    const byId = new Map(layouts.map((item) => [item.id, item]))
    return props.slots.flatMap((slot) => {
      const key = `${slot.meetingId}-${slot.memberUid}`
      const layout = byId.get(key)
      if (!layout) return []
      const accessible = props.resolveAccessibleMeeting(slot)
      const label = props.memberNameByUid.get(slot.memberUid) || 'Miembro'
      return [
        {
          key,
          title: accessible?.title || label,
          status: slot.status,
          start: new Date(slot.startAt),
          layout,
          onOpen: () => {
            if (accessible) props.onOpenMeeting(accessible)
          },
        },
      ]
    })
  }, [compact, props])

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

          <div className="relative overflow-hidden" style={{ height: gridHeight }}>
            {AGENDA_DAY_HOURS.map((hour) => (
              <div
                key={hour}
                className="pointer-events-none absolute inset-x-0 border-t border-white/[0.06]"
                style={{ top: (hour - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX }}
              />
            ))}

            {timedEvents.map((event) => (
              <AgendaTimedEventBlock
                key={event.key}
                event={event}
                compact={compact}
                size="day"
              />
            ))}
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
