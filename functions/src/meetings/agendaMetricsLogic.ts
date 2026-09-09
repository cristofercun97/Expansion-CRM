/**
 * Pure Agenda metrics helpers (Fase 3C). No I/O.
 */

export type AgendaMetricsRangePreset = 'today' | 'week' | 'month' | 'last_30_days'

export type AgendaMetricStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'
  | string

export type AgendaMetricMeeting = {
  id: string
  status: AgendaMetricStatus
  startAtMs: number
  title?: string
  meetingMode?: string
  meetingAudience?: string
  groupNameSnapshot?: string | null
  nextActionTaskId?: string | null
}

export type AgendaMetricTask = {
  id: string
  source?: string | null
  sourceMeetingId?: string | null
}

export type AgendaPersonalKpis = {
  scheduledCount: number
  completedCount: number
  noShowCount: number
  cancelledCount: number
  attendanceRate: number | null
  nextActionsCount: number
}

export type AgendaTeamMemberMetrics = {
  memberUid: string
  displayName: string
  scheduledCount: number
  completedCount: number
  noShowCount: number
  cancelledCount: number
  attendanceRate: number | null
}

const DAY_MS = 24 * 60 * 60_000

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function startOfLocalWeek(date: Date): Date {
  const day = startOfLocalDay(date)
  const weekday = (day.getDay() + 6) % 7 // Monday=0
  day.setDate(day.getDate() - weekday)
  return day
}

function endOfLocalWeek(date: Date): Date {
  const start = startOfLocalWeek(date)
  return endOfLocalDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
}

function startOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfLocalMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function getAgendaMetricsRange(
  preset: AgendaMetricsRangePreset,
  nowMs: number = Date.now(),
): {rangeStart: Date; rangeEnd: Date} {
  const now = new Date(nowMs)
  if (preset === 'today') {
    return {rangeStart: startOfLocalDay(now), rangeEnd: endOfLocalDay(now)}
  }
  if (preset === 'week') {
    return {rangeStart: startOfLocalWeek(now), rangeEnd: endOfLocalWeek(now)}
  }
  if (preset === 'month') {
    return {rangeStart: startOfLocalMonth(now), rangeEnd: endOfLocalMonth(now)}
  }
  // last_30_days inclusive of today
  const end = endOfLocalDay(now)
  const start = startOfLocalDay(new Date(end.getTime() - 29 * DAY_MS))
  return {rangeStart: start, rangeEnd: end}
}

export function computeAttendanceRate(
  completedCount: number,
  noShowCount: number,
): number | null {
  const denominator = completedCount + noShowCount
  if (denominator <= 0) return null
  return Math.round((completedCount / denominator) * 1000) / 10
}

export function formatAttendanceRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return '—'
  return Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`
}

export function calculateAgendaPersonalKpis(options: {
  meetings: AgendaMetricMeeting[]
  tasks?: AgendaMetricTask[]
  rangeStartMs: number
  rangeEndMs: number
}): AgendaPersonalKpis {
  const inRange = options.meetings.filter(
    (meeting) =>
      meeting.startAtMs >= options.rangeStartMs && meeting.startAtMs <= options.rangeEndMs,
  )

  let scheduledCount = 0
  let completedCount = 0
  let noShowCount = 0
  let cancelledCount = 0
  const meetingIds = new Set<string>()

  for (const meeting of inRange) {
    meetingIds.add(meeting.id)
    if (meeting.status === 'scheduled') scheduledCount += 1
    else if (meeting.status === 'completed') completedCount += 1
    else if (meeting.status === 'no_show') noShowCount += 1
    else if (meeting.status === 'cancelled') cancelledCount += 1
  }

  const tasks = options.tasks || []
  const nextActionsCount = tasks.filter(
    (task) =>
      task.source === 'agenda' &&
      typeof task.sourceMeetingId === 'string' &&
      meetingIds.has(task.sourceMeetingId),
  ).length

  return {
    scheduledCount,
    completedCount,
    noShowCount,
    cancelledCount,
    attendanceRate: computeAttendanceRate(completedCount, noShowCount),
    nextActionsCount,
  }
}

export function selectUpcomingMeetings(
  meetings: AgendaMetricMeeting[],
  options: {nowMs: number; rangeStartMs: number; rangeEndMs: number; limit?: number},
): AgendaMetricMeeting[] {
  const limit = options.limit ?? 5
  return meetings
    .filter(
      (meeting) =>
        (meeting.status === 'scheduled' || meeting.status === 'rescheduled') &&
        meeting.startAtMs >= options.nowMs &&
        meeting.startAtMs >= options.rangeStartMs &&
        meeting.startAtMs <= options.rangeEndMs,
    )
    .sort((a, b) => a.startAtMs - b.startAtMs)
    .slice(0, limit)
}

export function aggregateTeamMemberMetrics(options: {
  memberUid: string
  displayName: string
  statuses: AgendaMetricStatus[]
}): AgendaTeamMemberMetrics {
  let scheduledCount = 0
  let completedCount = 0
  let noShowCount = 0
  let cancelledCount = 0

  for (const status of options.statuses) {
    if (status === 'scheduled') scheduledCount += 1
    else if (status === 'completed') completedCount += 1
    else if (status === 'no_show') noShowCount += 1
    else if (status === 'cancelled') cancelledCount += 1
  }

  return {
    memberUid: options.memberUid,
    displayName: options.displayName,
    scheduledCount,
    completedCount,
    noShowCount,
    cancelledCount,
    attendanceRate: computeAttendanceRate(completedCount, noShowCount),
  }
}

export const AGENDA_METRICS_FORBIDDEN_FIELDS = [
  'title',
  'description',
  'notes',
  'resultNotes',
  'meetingUrl',
  'googleMeetUrl',
  'participants',
  'emails',
  'meetingId',
] as const

export function assertTeamMetricsDtoSanitized(row: Record<string, unknown>): void {
  for (const key of AGENDA_METRICS_FORBIDDEN_FIELDS) {
    if (key in row) {
      throw new Error(`PRIVATE_FIELD_LEAK:${key}`)
    }
  }
  const allowed = new Set([
    'memberUid',
    'displayName',
    'scheduledCount',
    'completedCount',
    'noShowCount',
    'cancelledCount',
    'attendanceRate',
  ])
  for (const key of Object.keys(row)) {
    if (!allowed.has(key)) {
      throw new Error(`UNEXPECTED_FIELD:${key}`)
    }
  }
}
