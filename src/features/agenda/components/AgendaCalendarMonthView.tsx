import type { Meeting } from '@/features/agenda/types/meeting.types'
import type { TeamAgendaSlot } from '@/features/agenda/services/team-agenda-functions.service'
import {
  statusBlockClass,
  statusDotClass,
  WEEKDAY_SHORT,
} from '@/features/agenda/utils/agendaCalendarUi'
import { isSameDay, startOfDay, timestampToDate } from '@/features/agenda/utils/meetingDateUtils'
import { cn } from '@/lib/utils'

const MAX_VISIBLE = 3

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

export type AgendaCalendarMonthViewProps = {
  monthDays: Date[]
  monthCursor: Date
  selectedDay: Date | null
  onSelectDay: (day: Date) => void
} & (PersonalProps | TeamProps)

export function AgendaCalendarMonthView(props: AgendaCalendarMonthViewProps) {
  const { monthDays, monthCursor, selectedDay, onSelectDay } = props
  const today = new Date()

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04]">
        {WEEKDAY_SHORT.map((label) => (
          <div
            key={label}
            className="px-1 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-hero-text/45 sm:text-xs"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {monthDays.map((day) => {
          const inCurrentMonth = day.getMonth() === monthCursor.getMonth()
          const isToday = isSameDay(day, today)
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false

          const items =
            props.mode === 'personal'
              ? props.meetings.filter((meeting) => {
                  const start = timestampToDate(meeting.startAt)
                  return start ? isSameDay(start, day) : false
                })
              : props.slots.filter((slot) => isSameDay(new Date(slot.startAt), day))

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[72px] border-b border-r border-white/8 p-1.5 text-left transition-colors sm:min-h-[104px] sm:p-2',
                !inCurrentMonth && 'bg-black/10 opacity-45',
                inCurrentMonth && 'hover:bg-white/[0.05]',
                isSelected && 'bg-gold/10 ring-2 ring-inset ring-gold/55',
                isToday && !isSelected && 'bg-teal-accent/5',
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(startOfDay(day))}
                className="flex w-full items-center justify-between gap-1 rounded-md text-left"
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-sm',
                    isToday && 'bg-gold text-petrol-deep',
                    !isToday && isSelected && 'text-gold-light',
                    !isToday && !isSelected && 'text-hero-text/75',
                  )}
                >
                  {day.getDate()}
                </span>
                {items.length > 0 ? (
                  <span className="hidden text-[10px] text-hero-text/40 sm:inline">
                    {items.length}
                  </span>
                ) : null}
              </button>

              <div className="mt-1 hidden space-y-0.5 sm:block">
                {props.mode === 'personal'
                  ? items.slice(0, MAX_VISIBLE).map((meeting) => {
                      const m = meeting as Meeting
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-1 truncate rounded-md border px-1 py-0.5 text-left text-[10px]',
                            statusBlockClass(m.status),
                          )}
                          onClick={() => props.onOpenMeeting(m)}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(m.status))} />
                          <span className="truncate">{m.title}</span>
                        </button>
                      )
                    })
                  : items.slice(0, MAX_VISIBLE).map((slot) => {
                      const s = slot as TeamAgendaSlot
                      const accessible = props.resolveAccessibleMeeting(s)
                      return (
                        <button
                          key={`${s.meetingId}-${s.memberUid}`}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-1 truncate rounded-md border px-1 py-0.5 text-left text-[10px]',
                            statusBlockClass(s.status),
                          )}
                          onClick={() => {
                            if (accessible) props.onOpenMeeting(accessible)
                            else onSelectDay(startOfDay(day))
                          }}
                        >
                          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(s.status))} />
                          <span className="truncate">
                            {props.memberNameByUid.get(s.memberUid) || 'Miembro'}
                          </span>
                        </button>
                      )
                    })}
                {items.length > MAX_VISIBLE ? (
                  <button
                    type="button"
                    className="px-0.5 text-left text-[10px] font-medium text-gold-light/80"
                    onClick={() => onSelectDay(startOfDay(day))}
                  >
                    +{items.length - MAX_VISIBLE} más
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="mt-1.5 flex w-full flex-wrap gap-0.5 sm:hidden"
                onClick={() => onSelectDay(startOfDay(day))}
                aria-label={`Ver reuniones del día ${day.getDate()}`}
              >
                {items.slice(0, 4).map((item, index) => {
                  const status =
                    props.mode === 'personal'
                      ? (item as Meeting).status
                      : (item as TeamAgendaSlot).status
                  return (
                    <span
                      key={index}
                      className={cn('h-1.5 w-1.5 rounded-full', statusDotClass(status))}
                    />
                  )
                })}
                {items.length > 4 ? (
                  <span className="text-[9px] text-hero-text/45">+{items.length - 4}</span>
                ) : null}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
