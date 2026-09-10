import type { OverlapLayoutItem } from '@/features/agenda/utils/agendaOverlapLayout'
import { statusBlockClass } from '@/features/agenda/utils/agendaCalendarUi'
import { cn } from '@/lib/utils'

export type TimedEventBlockModel = {
  key: string
  title: string
  status: string
  start: Date
  layout: OverlapLayoutItem
  onOpen: () => void
}

export function AgendaTimedEventBlock({
  event,
  compact,
  size = 'week',
}: {
  event: TimedEventBlockModel
  compact: boolean
  size?: 'week' | 'day'
}) {
  const narrow =
    event.layout.columnCount >= (size === 'day' ? 5 : 4) ||
    (compact && event.layout.columnCount >= 3)
  const timeLabel = event.start.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <button
      type="button"
      data-meeting-id={event.key}
      data-testid={`agenda-event-${event.key}`}
      data-start-ms={String(event.start.getTime())}
      data-top={String(event.layout.top)}
      data-column-index={String(event.layout.columnIndex)}
      data-column-count={String(event.layout.columnCount)}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        event.onOpen()
      }}
      className={cn(
        'absolute box-border overflow-hidden rounded-md border text-left shadow-sm transition-[transform,box-shadow] hover:z-30 hover:shadow-md',
        statusBlockClass(event.status),
        size === 'day'
          ? narrow
            ? 'rounded-lg px-1 py-1'
            : 'rounded-xl px-2 py-1.5'
          : narrow
            ? 'px-0.5 py-0.5'
            : 'px-1.5 py-1',
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
          size === 'day' ? (narrow ? 'text-[10px]' : 'text-xs') : narrow ? 'text-[9px]' : 'text-[10px]',
        )}
      >
        {timeLabel}
      </span>
      {event.layout.widthPct >= 12 || size === 'day' ? (
        <span
          className={cn(
            'mt-0.5 block truncate font-medium leading-tight',
            size === 'day'
              ? narrow
                ? 'text-[11px]'
                : 'text-sm font-semibold'
              : narrow
                ? 'text-[9px]'
                : 'text-[11px]',
          )}
        >
          {event.title}
        </span>
      ) : null}
    </button>
  )
}
