import type { MeetingStatus } from '@/features/agenda/types/meeting.types'
import { getMeetingStatusLabel } from '@/features/agenda/utils/meetingLabels'

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

export const AGENDA_DAY_HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 08–20
export const AGENDA_HOUR_PX = 52
export const AGENDA_GRID_START_HOUR = 8
export const AGENDA_GRID_END_HOUR = 21

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

export function minutesFromGridStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - AGENDA_GRID_START_HOUR * 60
}

export function blockStyleForRange(start: Date, end: Date): {
  top: number
  height: number
} {
  const startMin = Math.max(0, minutesFromGridStart(start))
  const endMin = Math.min(
    (AGENDA_GRID_END_HOUR - AGENDA_GRID_START_HOUR) * 60,
    minutesFromGridStart(end),
  )
  const duration = Math.max(28, endMin - startMin)
  const pxPerMin = AGENDA_HOUR_PX / 60
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
