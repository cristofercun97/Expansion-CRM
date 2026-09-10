import { useEffect, useMemo, useState } from 'react'
import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  AGENDA_DAY_HOURS,
  AGENDA_GRID_END_HOUR,
  AGENDA_GRID_START_HOUR,
  AGENDA_HOUR_PX,
  statusBlockClass,
} from '@/features/agenda/utils/agendaCalendarUi'
import {
  layoutOverlappingEvents,
  type OverlapLayoutItem,
} from '@/features/agenda/utils/agendaOverlapLayout'
import { addMinutes, isSameDay, startOfDay, timestampToDate } from '@/features/agenda/utils/meetingDateUtils'
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

export type AgendaCalendarWeekViewProps = {
  weekDays: Date[]
  selectedDay: Date | null
  onSelectDay: (day: Date) => void
} & (PersonalProps | TeamProps)

type RenderEvent = {
  key: string
  title: string
  status: string
  start: Date
  layout: OverlapLayoutItem
  onOpen: () => void
}

function useCompactWeekLayout(): boolean {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return compact
}

function EventBlock({
  event,
  compact,
}: {
  event: RenderEvent
  compact: boolean
}) {
  const narrow = event.layout.columnCount >= 4 || (compact && event.layout.columnCount >= 2)
  const timeLabel = event.start.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        event.onOpen()
      }}
      className={cn(
        'absolute overflow-hidden rounded-md border text-left shadow-sm transition-[transform,box-shadow] hover:z-30 hover:shadow-md',
        statusBlockClass(event.status),
        narrow ? 'px-0.5 py-0.5' : 'px-1.5 py-1',
      )}
      style={{
        top: event.layout.top,
        height: event.layout.height,
        left: `${event.layout.leftPct}%`,
        width: `${event.layout.widthPct}%`,
        zIndex: event.layout.zIndex,
      }}
      title={`${timeLabel} · ${event.title}`}
      aria-label={`${timeLabel} ${event.title}`}
    >
      <span
        className={cn(
          'block truncate font-semibold leading-tight',
          narrow ? 'text-[9px]' : 'text-[10px]',
        )}
      >
        {timeLabel}
      </span>
      {!narrow || event.layout.widthPct >= 18 ? (
        <span
          className={cn(
            'block truncate font-medium leading-tight',
            narrow ? 'text-[9px]' : 'text-[11px]',
          )}
        >
          {event.title}
        </span>
      ) : null}
    </button>
  )
}

export function AgendaCalendarWeekView(props: AgendaCalendarWeekViewProps) {
  const { weekDays, selectedDay, onSelectDay } = props
  const today = new Date()
  const gridHeight = (AGENDA_GRID_END_HOUR - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX
  const compact = useCompactWeekLayout()
  const strategy = compact ? 'peek' : 'columns'

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="min-w-[720px] lg:min-w-0">
          <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-white/10 bg-white/[0.04]">
            <div className="border-r border-white/8" />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              return (
                <button
                  key={`head-${day.toISOString()}`}
                  type="button"
                  onClick={() => onSelectDay(startOfDay(day))}
                  className={cn(
                    'border-r border-white/8 px-1 py-2.5 text-center last:border-r-0',
                    isSelected && 'bg-gold/10',
                    isToday && !isSelected && 'bg-teal-accent/5',
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-hero-text/50">
                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </p>
                  <p
                    className={cn(
                      'mx-auto mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                      isToday && 'bg-gold text-petrol-deep',
                      !isToday && isSelected && 'text-gold-light',
                      !isToday && !isSelected && 'text-hero-text',
                    )}
                  >
                    {day.getDate()}
                  </p>
                  {isToday ? (
                    <span className="mt-1 block text-[10px] font-medium text-gold-light">Hoy</span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))]">
            <div className="relative border-r border-white/8" style={{ height: gridHeight }}>
              {AGENDA_DAY_HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-hero-text/40"
                  style={{ top: (hour - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const isToday = isSameDay(day, today)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

              return (
                <DayColumn
                  key={`col-${day.toISOString()}`}
                  day={day}
                  isToday={isToday}
                  isSelected={isSelected}
                  gridHeight={gridHeight}
                  strategy={strategy}
                  compact={compact}
                  onSelectDay={onSelectDay}
                  props={props}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DayColumn({
  day,
  isToday,
  isSelected,
  gridHeight,
  strategy,
  compact,
  onSelectDay,
  props,
}: {
  day: Date
  isToday: boolean
  isSelected: boolean
  gridHeight: number
  strategy: 'columns' | 'peek'
  compact: boolean
  onSelectDay: (day: Date) => void
  props: AgendaCalendarWeekViewProps
}) {
  const events = useMemo((): RenderEvent[] => {
    if (props.mode === 'personal') {
      const dayMeetings = props.meetings.filter((meeting) => {
        const start = timestampToDate(meeting.startAt)
        return start ? isSameDay(start, day) : false
      })

      const inputs = dayMeetings.flatMap((meeting) => {
        const start = timestampToDate(meeting.startAt)
        if (!start) return []
        const end =
          timestampToDate(meeting.endAt) || addMinutes(start, meeting.durationMinutes || 30)
        return [{ id: meeting.id, startMs: start.getTime(), endMs: end.getTime() }]
      })

      const layouts = layoutOverlappingEvents(inputs, { strategy })
      const layoutById = new Map(layouts.map((item) => [item.id, item]))

      return dayMeetings.flatMap((meeting) => {
        const start = timestampToDate(meeting.startAt)
        const layout = layoutById.get(meeting.id)
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

    const daySlots = props.slots.filter((slot) => isSameDay(new Date(slot.startAt), day))
    const inputs = daySlots.map((slot) => ({
      id: `${slot.meetingId}-${slot.memberUid}`,
      startMs: new Date(slot.startAt).getTime(),
      endMs: new Date(slot.endAt).getTime(),
    }))
    const layouts = layoutOverlappingEvents(inputs, { strategy })
    const layoutById = new Map(layouts.map((item) => [item.id, item]))

    return daySlots.flatMap((slot) => {
      const key = `${slot.meetingId}-${slot.memberUid}`
      const layout = layoutById.get(key)
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
            else onSelectDay(startOfDay(day))
          },
        },
      ]
    })
  }, [day, onSelectDay, props, strategy])

  return (
    <div
      className={cn(
        'relative overflow-hidden border-r border-white/8 last:border-r-0',
        isSelected && 'bg-gold/[0.07] ring-2 ring-inset ring-gold/50',
        isToday && !isSelected && 'bg-teal-accent/[0.04]',
      )}
      style={{ height: gridHeight }}
      onClick={() => onSelectDay(startOfDay(day))}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelectDay(startOfDay(day))
        }
      }}
      role="button"
      tabIndex={0}
    >
      {AGENDA_DAY_HOURS.map((hour) => (
        <div
          key={hour}
          className="pointer-events-none absolute inset-x-0 border-t border-white/[0.06]"
          style={{ top: (hour - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX }}
        />
      ))}

      {events.map((event) => (
        <EventBlock key={event.key} event={event} compact={compact} />
      ))}
    </div>
  )
}
