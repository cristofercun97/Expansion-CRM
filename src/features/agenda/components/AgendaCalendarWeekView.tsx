import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  AGENDA_DAY_HOURS,
  AGENDA_GRID_END_HOUR,
  AGENDA_GRID_START_HOUR,
  AGENDA_HOUR_PX,
  blockStyleForRange,
  statusBlockClass,
} from '@/features/agenda/utils/agendaCalendarUi'
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

export function AgendaCalendarWeekView(props: AgendaCalendarWeekViewProps) {
  const { weekDays, selectedDay, onSelectDay } = props
  const today = new Date()
  const gridHeight = (AGENDA_GRID_END_HOUR - AGENDA_GRID_START_HOUR) * AGENDA_HOUR_PX

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
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

              const personalItems =
                props.mode === 'personal'
                  ? props.meetings.filter((meeting) => {
                      const start = timestampToDate(meeting.startAt)
                      return start ? isSameDay(start, day) : false
                    })
                  : []

              const teamItems =
                props.mode === 'team'
                  ? props.slots.filter((slot) => isSameDay(new Date(slot.startAt), day))
                  : []

              return (
                <div
                  key={`col-${day.toISOString()}`}
                  className={cn(
                    'relative border-r border-white/8 last:border-r-0',
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

                  {props.mode === 'personal'
                    ? personalItems.map((meeting) => {
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
                            onClick={(event) => {
                              event.stopPropagation()
                              props.onOpenMeeting(meeting)
                            }}
                            className={cn(
                              'absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm transition-transform hover:z-10 hover:scale-[1.01]',
                              statusBlockClass(meeting.status),
                            )}
                            style={{ top: style.top, height: style.height }}
                            title={meeting.title}
                          >
                            <span className="block truncate text-[10px] font-semibold leading-tight">
                              {start.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="block truncate text-[11px] font-medium leading-tight">
                              {meeting.title}
                            </span>
                          </button>
                        )
                      })
                    : teamItems.map((slot) => {
                        const start = new Date(slot.startAt)
                        const end = new Date(slot.endAt)
                        const style = blockStyleForRange(start, end)
                        const accessible = props.resolveAccessibleMeeting(slot)
                        const label = props.memberNameByUid.get(slot.memberUid) || 'Miembro'
                        return (
                          <button
                            key={`${slot.meetingId}-${slot.memberUid}`}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (accessible) props.onOpenMeeting(accessible)
                              else onSelectDay(startOfDay(day))
                            }}
                            className={cn(
                              'absolute inset-x-1 overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm',
                              statusBlockClass(slot.status),
                            )}
                            style={{ top: style.top, height: style.height }}
                            title={label}
                          >
                            <span className="block truncate text-[10px] font-semibold leading-tight">
                              {start.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="block truncate text-[11px] font-medium leading-tight">
                              {label}
                            </span>
                          </button>
                        )
                      })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
