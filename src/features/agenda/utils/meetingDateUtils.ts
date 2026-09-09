import type { Timestamp } from 'firebase/firestore'

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function combineLocalDateAndTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }

  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const value = new Date(year, month - 1, day, hours, minutes, 0, 0)

  if (Number.isNaN(value.getTime())) {
    return null
  }

  return value
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function timestampToDate(value: Timestamp | null | undefined): Date | null {
  if (!value?.toDate) {
    return null
  }

  return value.toDate()
}

export function formatMeetingDate(value: Timestamp | Date | null | undefined): string {
  const date = value instanceof Date ? value : timestampToDate(value ?? null)
  if (!date) {
    return '—'
  }

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatMeetingTime(value: Timestamp | Date | null | undefined): string {
  const date = value instanceof Date ? value : timestampToDate(value ?? null)
  if (!date) {
    return '—'
  }

  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMeetingDateTimeRange(
  start: Timestamp | Date | null | undefined,
  end: Timestamp | Date | null | undefined,
): string {
  const startDate = start instanceof Date ? start : timestampToDate(start ?? null)
  const endDate = end instanceof Date ? end : timestampToDate(end ?? null)

  if (!startDate) {
    return '—'
  }

  const dateLabel = startDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const startLabel = formatMeetingTime(startDate)
  const endLabel = endDate ? formatMeetingTime(endDate) : null

  return endLabel ? `${dateLabel} · ${startLabel}–${endLabel}` : `${dateLabel} · ${startLabel}`
}

export function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export function startOfWeek(date: Date): Date {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  return next
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

/** Grid Monday→Sunday covering the visible month (includes adjacent-month days). */
export function getMonthCalendarDays(reference: Date): Date[] {
  const firstOfMonth = startOfMonth(reference)
  const gridStart = startOfWeek(firstOfMonth)
  const lastOfMonth = endOfMonth(reference)
  const lastWeekStart = startOfWeek(lastOfMonth)
  const gridEnd = addDays(lastWeekStart, 6)

  const days: Date[] = []
  let cursor = gridStart
  while (cursor.getTime() <= gridEnd.getTime()) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}
