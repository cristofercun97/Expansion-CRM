import type { MeetingStatus } from '@/features/agenda/types/meeting.types'
import { getMeetingStatusLabel } from '@/features/agenda/utils/meetingLabels'

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

/** Default visible day grid: 08:00 → 21:00 exclusive (labels 08–20). */
export const AGENDA_HOUR_PX = 52
export const AGENDA_DEFAULT_START_HOUR = 8
export const AGENDA_DEFAULT_END_HOUR = 21
/** @deprecated Prefer resolveAgendaVisibleHourRange — kept for callers/tests. */
export const AGENDA_GRID_START_HOUR = AGENDA_DEFAULT_START_HOUR
/** @deprecated Prefer resolveAgendaVisibleHourRange */
export const AGENDA_GRID_END_HOUR = AGENDA_DEFAULT_END_HOUR
export const AGENDA_DAY_HOURS = Array.from(
  { length: AGENDA_DEFAULT_END_HOUR - AGENDA_DEFAULT_START_HOUR },
  (_, i) => AGENDA_DEFAULT_START_HOUR + i,
)

export type AgendaVisibleHourRange = {
  startHour: number
  /** Exclusive end hour (grid ends at this clock hour). */
  endHour: number
  hourLabels: number[]
}

/**
 * Expand the visible hour grid around real meetings.
 * Early events (e.g. 03:53) pull startHour down; late ones push endHour up.
 * Never clamps meetings into a fixed 08:00 origin.
 */
export function resolveAgendaVisibleHourRange(
  events: Array<{ startMs: number; endMs: number }>,
  options?: {
    defaultStartHour?: number
    defaultEndHour?: number
  },
): AgendaVisibleHourRange {
  const defaultStartHour = options?.defaultStartHour ?? AGENDA_DEFAULT_START_HOUR
  const defaultEndHour = options?.defaultEndHour ?? AGENDA_DEFAULT_END_HOUR

  let startHour = defaultStartHour
  let endHour = defaultEndHour

  for (const event of events) {
    const start = new Date(event.startMs)
    const end = new Date(Math.max(event.endMs, event.startMs + 1))
    const startH = start.getHours() + start.getMinutes() / 60
    const endH = end.getHours() + end.getMinutes() / 60 + end.getSeconds() / 3600
    startHour = Math.min(startHour, Math.floor(startH))
    endHour = Math.max(endHour, Math.ceil(endH))
  }

  startHour = Math.max(0, Math.min(23, startHour))
  endHour = Math.max(startHour + 1, Math.min(24, endHour))

  const hourLabels = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  return { startHour, endHour, hourLabels }
}

export function buildAgendaHourLabels(startHour: number, endHour: number): number[] {
  return Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i)
}

export function statusChipClass(status: string): string {
  switch (status) {
    case 'scheduled':
    case 'rescheduled':
      return 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
    case 'completed':
      return 'border-sky-400/35 bg-sky-500/15 text-sky-200'
    case 'no_show':
      return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
    case 'cancelled':
      return 'border-rose-400/35 bg-rose-500/15 text-rose-200'
    default:
      return 'border-white/15 bg-white/5 text-hero-text/75'
  }
}

export function statusBlockClass(status: string): string {
  switch (status) {
    case 'scheduled':
    case 'rescheduled':
      return 'border-emerald-400/40 bg-emerald-500/20 text-hero-text'
    case 'completed':
      return 'border-sky-400/40 bg-sky-500/20 text-hero-text'
    case 'no_show':
      return 'border-amber-400/45 bg-amber-500/20 text-hero-text'
    case 'cancelled':
      return 'border-rose-400/40 bg-rose-500/20 text-hero-text line-through decoration-rose-200/50'
    default:
      return 'border-white/20 bg-white/10 text-hero-text'
  }
}

export function statusDotClass(status: string): string {
  switch (status) {
    case 'scheduled':
    case 'rescheduled':
      return 'bg-emerald-400'
    case 'completed':
      return 'bg-sky-400'
    case 'no_show':
      return 'bg-amber-400'
    case 'cancelled':
      return 'bg-rose-400'
    default:
      return 'bg-white/40'
  }
}

export function formatStatusLabel(status: string): string {
  return getMeetingStatusLabel(status as MeetingStatus)
}

export function formatDayHeading(date: Date): string {
  const raw = date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function minutesFromGridStart(date: Date, gridStartHour: number = AGENDA_DEFAULT_START_HOUR): number {
  return date.getHours() * 60 + date.getMinutes() - gridStartHour * 60
}

export function blockStyleForRange(
  start: Date,
  end: Date,
  options?: {
    gridStartHour?: number
    gridEndHour?: number
    hourPx?: number
    minHeightPx?: number
  },
): {
  top: number
  height: number
} {
  const gridStartHour = options?.gridStartHour ?? AGENDA_DEFAULT_START_HOUR
  const gridEndHour = options?.gridEndHour ?? AGENDA_DEFAULT_END_HOUR
  const hourPx = options?.hourPx ?? AGENDA_HOUR_PX
  const minHeightPx = options?.minHeightPx ?? 28
  const spanMin = (gridEndHour - gridStartHour) * 60
  const startMin = Math.max(0, minutesFromGridStart(start, gridStartHour))
  const endMin = Math.min(spanMin, minutesFromGridStart(end, gridStartHour))
  const duration = Math.max(minHeightPx / (hourPx / 60), endMin - startMin)
  const pxPerMin = hourPx / 60
  return {
    top: startMin * pxPerMin,
    height: duration * pxPerMin,
  }
}

export const MODE_SHORT_LABEL: Record<string, string> = {
  video: 'Video',
  in_person: 'Presencial',
  other: 'Otra',
}
