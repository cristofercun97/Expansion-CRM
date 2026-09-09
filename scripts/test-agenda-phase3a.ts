/**
 * Agenda Phase 3A — pure schedule utils tests.
 */
import assert from 'node:assert/strict'
import {
  applyAdvancedFilters,
  EMPTY_ADVANCED_FILTERS,
  filterTeamVisibleMeetings,
  findOverlappingMeetings,
  getViewRange,
  intervalsOverlap,
  meetingMatchesSearch,
  shiftAnchor,
  toBusySlots,
} from '../src/features/agenda/utils/agendaScheduleUtils.ts'
import type { Meeting } from '../src/features/agenda/types/meeting.types.ts'
import { addDays, startOfDay, startOfWeek } from '../src/features/agenda/utils/meetingDateUtils.ts'

function ts(date: Date) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
  } as Meeting['startAt']
}

function meeting(partial: Partial<Meeting> & { id: string; title: string }): Meeting {
  const start = partial.startAt ? (partial.startAt as Meeting['startAt'])!.toDate() : new Date()
  const end =
    partial.endAt ? (partial.endAt as Meeting['endAt'])!.toDate() : new Date(start.getTime() + 60 * 60_000)
  return {
    id: partial.id,
    title: partial.title,
    type: 'follow_up',
    description: '',
    notes: '',
    resultNotes: '',
    status: partial.status || 'scheduled',
    startAt: partial.startAt || ts(start),
    endAt: partial.endAt || ts(end),
    durationMinutes: 60,
    timezone: 'Europe/Madrid',
    organizerId: partial.organizerId || 'org',
    organizerName: partial.organizerName || 'Org',
    contactId: null,
    meetingAudience: partial.meetingAudience || 'individual',
    groupId: partial.groupId ?? null,
    groupNameSnapshot: partial.groupNameSnapshot ?? null,
    participants: partial.participants || [],
    participantUserIds: partial.participantUserIds || [],
    meetingMode: partial.meetingMode || 'other',
    videoProvider: 'none',
    meetingUrl: null,
    location: null,
    meetingProvider: 'none',
    googleCalendarEventId: null,
    googleCalendarHtmlLink: null,
    googleMeetUrl: null,
    createdAt: null,
    updatedAt: null,
    createdBy: 'org',
    updatedBy: 'org',
    completedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    resultRecordedBy: null,
    resultRecordedAt: null,
  }
}

function pass(id: string) {
  console.log(`PASS ${id}`)
}

// VIEW-01 day order — chronological sort of same-day meetings
{
  const day = startOfDay(new Date('2026-09-10T00:00:00'))
  const items = [
    meeting({
      id: 'b',
      title: 'Late',
      startAt: ts(new Date(day.getTime() + 15 * 60 * 60_000)),
      endAt: ts(new Date(day.getTime() + 16 * 60 * 60_000)),
    }),
    meeting({
      id: 'a',
      title: 'Early',
      startAt: ts(new Date(day.getTime() + 9 * 60 * 60_000)),
      endAt: ts(new Date(day.getTime() + 10 * 60 * 60_000)),
    }),
  ].sort(
    (left, right) =>
      (left.startAt?.toMillis?.() ?? 0) - (right.startAt?.toMillis?.() ?? 0),
  )
  assert.equal(items[0]!.id, 'a')
  assert.equal(items[1]!.id, 'b')
  pass('VIEW-01')
}

// VIEW-02 week range Mon–Sun
{
  const wednesday = new Date('2026-09-09T12:00:00')
  const { rangeStart, rangeEnd } = getViewRange('week', wednesday)
  assert.equal(rangeStart.getDay(), 1)
  assert.equal(startOfWeek(wednesday).getTime(), rangeStart.getTime())
  assert.ok(rangeEnd.getTime() > rangeStart.getTime())
  assert.ok(rangeEnd.getTime() - rangeStart.getTime() >= 6 * 86_400_000)
  pass('VIEW-02')
}

// VIEW-03 month range covers month grid
{
  const { rangeStart, rangeEnd } = getViewRange('month', new Date('2026-09-15T12:00:00'))
  assert.ok(rangeStart.getTime() <= new Date('2026-09-01').getTime())
  assert.ok(rangeEnd.getTime() >= new Date('2026-09-30').getTime())
  pass('VIEW-03')
}

// FILTER-01 combined
{
  const items = [
    meeting({
      id: '1',
      title: 'A',
      status: 'scheduled',
      meetingMode: 'video',
      meetingAudience: 'group',
      groupId: 'g1',
      organizerId: 'u1',
    }),
    meeting({
      id: '2',
      title: 'B',
      status: 'completed',
      meetingMode: 'video',
      meetingAudience: 'individual',
      organizerId: 'u1',
    }),
    meeting({
      id: '3',
      title: 'C',
      status: 'scheduled',
      meetingMode: 'in_person',
      meetingAudience: 'group',
      groupId: 'g1',
      organizerId: 'u2',
      participantUserIds: ['u1'],
    }),
  ]
  const filtered = applyAdvancedFilters(
    items,
    {
      ...EMPTY_ADVANCED_FILTERS,
      statuses: ['scheduled'],
      modes: ['video'],
      audiences: ['group'],
      groupId: 'g1',
      role: 'organized',
    },
    'u1',
  )
  assert.deepEqual(
    filtered.map((m) => m.id),
    ['1'],
  )
  pass('FILTER-01')
}

// SEARCH-01
{
  const items = [
    meeting({
      id: '1',
      title: 'Kickoff María',
      groupNameSnapshot: 'Equipo Norte',
      participants: [{ type: 'contact', name: 'María López', contactId: 'c1' }],
    }),
    meeting({ id: '2', title: 'Otro', participants: [] }),
  ]
  assert.equal(meetingMatchesSearch(items[0]!, 'maria'), true)
  assert.equal(meetingMatchesSearch(items[0]!, 'norte'), true)
  assert.equal(meetingMatchesSearch(items[1]!, 'maria'), false)
  pass('SEARCH-01')
}

// CONFLICT-01 overlap
{
  const existing = [
    meeting({
      id: 'x',
      title: 'Existing',
      startAt: ts(new Date('2026-09-10T10:00:00')),
      endAt: ts(new Date('2026-09-10T11:00:00')),
    }),
  ]
  const overlaps = findOverlappingMeetings({
    meetings: existing,
    startAt: new Date('2026-09-10T10:30:00'),
    endAt: new Date('2026-09-10T11:30:00'),
  })
  assert.equal(overlaps.length, 1)
  assert.equal(
    intervalsOverlap(
      new Date('2026-09-10T10:30:00'),
      new Date('2026-09-10T11:30:00'),
      new Date('2026-09-10T10:00:00'),
      new Date('2026-09-10T11:00:00'),
    ),
    true,
  )
  pass('CONFLICT-01')
}

// CONFLICT-02 adjacent no conflict
{
  assert.equal(
    intervalsOverlap(
      new Date('2026-09-10T11:00:00'),
      new Date('2026-09-10T12:00:00'),
      new Date('2026-09-10T10:00:00'),
      new Date('2026-09-10T11:00:00'),
    ),
    false,
  )
  const overlaps = findOverlappingMeetings({
    meetings: [
      meeting({
        id: 'x',
        title: 'Existing',
        startAt: ts(new Date('2026-09-10T10:00:00')),
        endAt: ts(new Date('2026-09-10T11:00:00')),
      }),
    ],
    startAt: new Date('2026-09-10T11:00:00'),
    endAt: new Date('2026-09-10T12:00:00'),
  })
  assert.equal(overlaps.length, 0)
  pass('CONFLICT-02')
}

// CONFLICT-03 cancelled ignored
{
  const overlaps = findOverlappingMeetings({
    meetings: [
      meeting({
        id: 'x',
        title: 'Cancelled',
        status: 'cancelled',
        startAt: ts(new Date('2026-09-10T10:00:00')),
        endAt: ts(new Date('2026-09-10T11:00:00')),
      }),
    ],
    startAt: new Date('2026-09-10T10:15:00'),
    endAt: new Date('2026-09-10T10:45:00'),
  })
  assert.equal(overlaps.length, 0)
  pass('CONFLICT-03')
}

// CONFLICT-04 ignore self on reschedule
{
  const overlaps = findOverlappingMeetings({
    meetings: [
      meeting({
        id: 'self',
        title: 'Self',
        startAt: ts(new Date('2026-09-10T10:00:00')),
        endAt: ts(new Date('2026-09-10T11:00:00')),
      }),
    ],
    startAt: new Date('2026-09-10T10:00:00'),
    endAt: new Date('2026-09-10T11:00:00'),
    ignoreMeetingId: 'self',
  })
  assert.equal(overlaps.length, 0)
  pass('CONFLICT-04')
}

// AVAIL-01 busy slots only scheduled/rescheduled
{
  const slots = toBusySlots([
    meeting({
      id: '1',
      title: 'Busy',
      status: 'scheduled',
      startAt: ts(new Date('2026-09-10T09:00:00')),
      endAt: ts(new Date('2026-09-10T10:00:00')),
    }),
    meeting({
      id: '2',
      title: 'Done',
      status: 'completed',
      startAt: ts(new Date('2026-09-10T11:00:00')),
      endAt: ts(new Date('2026-09-10T12:00:00')),
    }),
  ])
  assert.equal(slots.length, 1)
  assert.equal(slots[0]!.meetingId, '1')
  pass('AVAIL-01')
}

// TEAM-01 authorized visible group meetings only
{
  const items = [
    meeting({
      id: 'g',
      title: 'Team',
      meetingAudience: 'group',
      groupId: 'team1',
    }),
    meeting({
      id: 'p',
      title: 'Private',
      meetingAudience: 'individual',
      groupId: null,
    }),
    meeting({
      id: 'other',
      title: 'Other team',
      meetingAudience: 'group',
      groupId: 'team2',
    }),
  ]
  const visible = filterTeamVisibleMeetings(items, 'team1')
  assert.deepEqual(
    visible.map((m) => m.id),
    ['g'],
  )
  pass('TEAM-01')
}

// TEAM-02 unauthorized / no owned team → empty (no foreign agenda)
{
  assert.deepEqual(filterTeamVisibleMeetings([meeting({ id: '1', title: 'X', meetingAudience: 'group', groupId: 't' })], null), [])
  assert.deepEqual(filterTeamVisibleMeetings([meeting({ id: '1', title: 'X', meetingAudience: 'group', groupId: 't' })], ''), [])
  pass('TEAM-02')
}

// navigation sanity
{
  const day = startOfDay(new Date('2026-09-10'))
  assert.equal(shiftAnchor('day', day, 1).getDate(), 11)
  assert.equal(shiftAnchor('week', day, 1).getTime(), addDays(day, 7).getTime())
}

console.log('Agenda phase 3A tests: PASS')
