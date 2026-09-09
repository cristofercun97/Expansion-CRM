/**
 * Pure Agenda Phase 3A schedule helpers (ranges, filters, conflicts, search).
 */

import type {
  Meeting,
  MeetingAudience,
  MeetingMode,
  MeetingStatus,
} from '../types/meeting.types'
import {
  addDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  timestampToDate,
} from './meetingDateUtils'

export type AgendaCalendarView = 'day' | 'week' | 'month' | 'list'

export type AgendaAdvancedFilters = {
  statuses: MeetingStatus[]
  modes: MeetingMode[]
  audiences: MeetingAudience[]
  groupId: string | null
  role: 'all' | 'organized' | 'invited'
  query: string
}

export const EMPTY_ADVANCED_FILTERS: AgendaAdvancedFilters = {
  statuses: [],
  modes: [],
  audiences: [],
  groupId: null,
  role: 'all',
  query: '',
}

/** Active statuses that can conflict with a new/rescheduled slot. */
const CONFLICT_STATUSES = new Set<MeetingStatus>(['scheduled', 'rescheduled'])

export function intervalsOverlap(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date,
): boolean {
  return newStart.getTime() < existingEnd.getTime() && newEnd.getTime() > existingStart.getTime()
}

export function findOverlappingMeetings(options: {
  meetings: Meeting[]
  startAt: Date
  endAt: Date
  ignoreMeetingId?: string | null
}): Meeting[] {
  const { meetings, startAt, endAt, ignoreMeetingId } = options
  return meetings.filter((meeting) => {
    if (ignoreMeetingId && meeting.id === ignoreMeetingId) return false
    if (!CONFLICT_STATUSES.has(meeting.status)) return false
    const existingStart = timestampToDate(meeting.startAt)
    const existingEnd = timestampToDate(meeting.endAt)
    if (!existingStart || !existingEnd) return false
    return intervalsOverlap(startAt, endAt, existingStart, existingEnd)
  })
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6))
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function getViewRange(
  view: AgendaCalendarView,
  anchor: Date,
): { rangeStart: Date; rangeEnd: Date } {
  if (view === 'day') {
    return { rangeStart: startOfDay(anchor), rangeEnd: endOfDay(anchor) }
  }
  if (view === 'week') {
    const start = startOfWeek(anchor)
    return { rangeStart: start, rangeEnd: endOfWeek(anchor) }
  }
  if (view === 'month') {
    const start = startOfWeek(startOfMonth(anchor))
    const end = endOfWeek(endOfMonth(anchor))
    return { rangeStart: start, rangeEnd: end }
  }
  // list: ± window around anchor for performance
  const start = startOfDay(addDays(anchor, -14))
  const end = endOfDay(addDays(anchor, 60))
  return { rangeStart: start, rangeEnd: end }
}

export function shiftAnchor(
  view: AgendaCalendarView,
  anchor: Date,
  direction: -1 | 1,
): Date {
  if (view === 'day' || view === 'list') return addDays(anchor, direction)
  if (view === 'week') return addWeeks(anchor, direction)
  return addMonths(anchor, direction)
}

export function formatViewRangeLabel(view: AgendaCalendarView, anchor: Date): string {
  if (view === 'day' || view === 'list') {
    return anchor.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'week') {
    const { rangeStart, rangeEnd } = getViewRange('week', anchor)
    const left = rangeStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    const right = rangeEnd.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${left} – ${right}`
  }
  return anchor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function meetingMatchesSearch(meeting: Meeting, rawQuery: string): boolean {
  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
  const q = normalize(rawQuery)
  if (!q) return true
  if (normalize(meeting.title).includes(q)) return true
  if (normalize(meeting.groupNameSnapshot || '').includes(q)) return true
  if (normalize(meeting.organizerName || '').includes(q)) return true
  for (const participant of meeting.participants || []) {
    if (normalize(participant.name || '').includes(q)) return true
    if (normalize(participant.email || '').includes(q)) return true
  }
  return false
}

export function applyAdvancedFilters(
  meetings: Meeting[],
  filters: AgendaAdvancedFilters,
  currentUserId: string,
): Meeting[] {
  return meetings.filter((meeting) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(meeting.status)) {
      return false
    }
    if (filters.modes.length > 0 && !filters.modes.includes(meeting.meetingMode)) {
      return false
    }
    if (filters.audiences.length > 0 && !filters.audiences.includes(meeting.meetingAudience)) {
      return false
    }
    if (filters.groupId && meeting.groupId !== filters.groupId) {
      return false
    }
    if (filters.role === 'organized' && meeting.organizerId !== currentUserId) {
      return false
    }
    if (
      filters.role === 'invited' &&
      (meeting.organizerId === currentUserId ||
        !(meeting.participantUserIds || []).includes(currentUserId))
    ) {
      return false
    }
    if (!meetingMatchesSearch(meeting, filters.query)) {
      return false
    }
    return true
  })
}

/** Busy slots for availability UI (scheduled/rescheduled only). */
export type BusySlot = {
  meetingId: string
  startAt: Date
  endAt: Date
  title: string
}

export function toBusySlots(meetings: Meeting[]): BusySlot[] {
  return meetings
    .filter((m) => CONFLICT_STATUSES.has(m.status))
    .map((m) => {
      const startAt = timestampToDate(m.startAt)
      const endAt = timestampToDate(m.endAt)
      if (!startAt || !endAt) return null
      return { meetingId: m.id, startAt, endAt, title: m.title }
    })
    .filter((slot): slot is BusySlot => Boolean(slot))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
}

/**
 * Team-safe filter: only group meetings of ownedTeam already visible to the user.
 * Does NOT expand access to other members' private meetings.
 */
export function filterTeamVisibleMeetings(
  meetings: Meeting[],
  ownedTeamId: string | null | undefined,
): Meeting[] {
  const teamId = ownedTeamId?.trim()
  if (!teamId) return []
  return meetings.filter(
    (m) => m.meetingAudience === 'group' && m.groupId === teamId,
  )
}
