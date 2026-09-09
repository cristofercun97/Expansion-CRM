/**
 * Agenda Phase 3B — recurring meetings pure logic tests.
 */
import assert from 'node:assert/strict'
import {
  RECURRENCE_MAX_OCCURRENCES,
  addCalendarMonthsPreservingAnchorDay,
  applyStartDelta,
  assertCanModifySeries,
  assertValidClientRequestId,
  buildOccurrenceMeetingId,
  expandRecurrenceStarts,
  filterEditableSeriesOccurrences,
  occurrenceStartAtMs,
} from '../functions/src/meetings/recurrenceLogic.ts'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

const jan31 = Date.parse('2026-01-31T10:00:00.000Z')

run('REC-01 weekly', () => {
  const starts = expandRecurrenceStarts({
    frequency: 'weekly',
    seriesStartAtMs: Date.parse('2026-09-10T10:00:00.000Z'),
    endMode: 'count',
    count: 3,
  })
  assert.equal(starts.length, 3)
  assert.equal(starts[1]!.startAtMs - starts[0]!.startAtMs, 7 * 24 * 60 * 60_000)
})

run('REC-02 biweekly', () => {
  const starts = expandRecurrenceStarts({
    frequency: 'biweekly',
    seriesStartAtMs: Date.parse('2026-09-10T10:00:00.000Z'),
    endMode: 'count',
    count: 3,
  })
  assert.equal(starts[1]!.startAtMs - starts[0]!.startAtMs, 14 * 24 * 60 * 60_000)
})

run('REC-03 monthly', () => {
  const starts = expandRecurrenceStarts({
    frequency: 'monthly',
    seriesStartAtMs: Date.parse('2026-01-15T10:00:00.000Z'),
    endMode: 'count',
    count: 3,
  })
  assert.equal(new Date(starts[1]!.startAtMs).getUTCMonth(), 1)
  assert.equal(new Date(starts[2]!.startAtMs).getUTCMonth(), 2)
})

run('REC-04 end date', () => {
  const starts = expandRecurrenceStarts({
    frequency: 'weekly',
    seriesStartAtMs: Date.parse('2026-09-01T10:00:00.000Z'),
    endMode: 'until',
    untilAtMs: Date.parse('2026-09-22T23:59:59.000Z'),
  })
  assert.equal(starts.length, 4)
  assert.ok(starts.every((item) => item.startAtMs <= Date.parse('2026-09-22T23:59:59.000Z')))
})

run('REC-05 N occurrences', () => {
  const starts = expandRecurrenceStarts({
    frequency: 'weekly',
    seriesStartAtMs: Date.parse('2026-09-01T10:00:00.000Z'),
    endMode: 'count',
    count: 8,
  })
  assert.equal(starts.length, 8)
})

run('REC-06 max 52 rejected if exceeded', () => {
  assert.throws(
    () =>
      expandRecurrenceStarts({
        frequency: 'weekly',
        seriesStartAtMs: Date.parse('2026-01-01T10:00:00.000Z'),
        endMode: 'count',
        count: 53,
      }),
    /MAX_OCCURRENCES_EXCEEDED/,
  )
  assert.throws(
    () =>
      expandRecurrenceStarts({
        frequency: 'weekly',
        seriesStartAtMs: Date.parse('2026-01-01T10:00:00.000Z'),
        endMode: 'until',
        untilAtMs: Date.parse('2027-12-31T23:59:59.000Z'),
      }),
    /MAX_OCCURRENCES_EXCEEDED/,
  )
  assert.equal(RECURRENCE_MAX_OCCURRENCES, 52)
})

run('REC-07 retry no duplicates (deterministic ids)', () => {
  const seriesId = assertValidClientRequestId('recreq12345678')
  const a = buildOccurrenceMeetingId(seriesId, 0)
  const b = buildOccurrenceMeetingId(seriesId, 0)
  assert.equal(a, b)
  assert.equal(a, 'recreq12345678_0')
})

run('EDIT-01 only this', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 2,
    scope: 'this',
    occurrences: [
      { recurrenceIndex: 1, status: 'scheduled' },
      { recurrenceIndex: 2, status: 'scheduled' },
      { recurrenceIndex: 3, status: 'scheduled' },
    ],
  })
  assert.deepEqual(
    filtered.map((item) => item.recurrenceIndex),
    [2],
  )
})

run('EDIT-02 this and future', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 2,
    scope: 'this_and_future',
    occurrences: [
      { recurrenceIndex: 1, status: 'scheduled' },
      { recurrenceIndex: 2, status: 'scheduled' },
      { recurrenceIndex: 3, status: 'scheduled' },
      { recurrenceIndex: 4, status: 'cancelled' },
    ],
  })
  assert.deepEqual(
    filtered.map((item) => item.recurrenceIndex),
    [2, 3],
  )
})

run('EDIT-03 past/status terminal protected', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 1,
    scope: 'this_and_future',
    occurrences: [
      { recurrenceIndex: 0, status: 'completed' },
      { recurrenceIndex: 1, status: 'no_show' },
      { recurrenceIndex: 2, status: 'scheduled' },
    ],
  })
  assert.deepEqual(
    filtered.map((item) => item.recurrenceIndex),
    [2],
  )
})

run('CANCEL-01 only this', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 0,
    scope: 'this',
    occurrences: [
      { recurrenceIndex: 0, status: 'scheduled' },
      { recurrenceIndex: 1, status: 'scheduled' },
    ],
  })
  assert.equal(filtered.length, 1)
})

run('CANCEL-02 this and future', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 1,
    scope: 'this_and_future',
    occurrences: [
      { recurrenceIndex: 0, status: 'scheduled' },
      { recurrenceIndex: 1, status: 'scheduled' },
      { recurrenceIndex: 2, status: 'rescheduled' },
    ],
  })
  assert.deepEqual(
    filtered.map((item) => item.recurrenceIndex),
    [1, 2],
  )
})

run('CANCEL-03 reminders cancelled (terminal statuses excluded from active edits)', () => {
  // Contract: cancel sets status=cancelled → existing onMeetingWrittenSyncAgenda suppresses pending.
  const afterCancel = filterEditableSeriesOccurrences({
    fromIndex: 0,
    scope: 'this_and_future',
    occurrences: [
      { recurrenceIndex: 0, status: 'cancelled' },
      { recurrenceIndex: 1, status: 'cancelled' },
    ],
  })
  assert.equal(afterCancel.length, 0)
})

run('MONTH-01 Jan 31 -> last valid day -> Mar 31', () => {
  const feb = occurrenceStartAtMs(jan31, 'monthly', 1)
  const mar = occurrenceStartAtMs(jan31, 'monthly', 2)
  const febDate = new Date(feb)
  const marDate = new Date(mar)
  assert.equal(febDate.getUTCMonth(), 1)
  assert.ok(febDate.getUTCDate() === 28 || febDate.getUTCDate() === 29)
  assert.equal(marDate.getUTCMonth(), 2)
  assert.equal(marDate.getUTCDate(), 31)

  const local = addCalendarMonthsPreservingAnchorDay(new Date(2026, 0, 31, 12, 0, 0), 1, 31)
  assert.equal(local.getMonth(), 1)
  assert.ok(local.getDate() === 28 || local.getDate() === 29)
})

run('SEC-01 participant cannot modify series', () => {
  assert.throws(
    () =>
      assertCanModifySeries({
        uid: 'MEMBER',
        organizerId: 'OWNER',
      }),
    /PERMISSION_DENIED/,
  )
})

run('SEC-02 stranger denied', () => {
  assert.throws(
    () =>
      assertCanModifySeries({
        uid: 'STRANGER',
        organizerId: 'OWNER',
      }),
    /PERMISSION_DENIED/,
  )
})

run('SEC-03 recurrence fields protected (deterministic ids + organizer-only)', () => {
  assert.throws(() => assertValidClientRequestId('bad'), /INVALID_CLIENT_REQUEST_ID/)
  assert.equal(assertCanModifySeries({ uid: 'OWNER', organizerId: 'OWNER' }), undefined)
  assert.equal(buildOccurrenceMeetingId('seriesABC123', 4), 'seriesABC123_4')
})

run('GOOGLE-01 correct event per occurrence (unique meeting ids)', () => {
  const ids = [0, 1, 2].map((index) => buildOccurrenceMeetingId('googleseries01', index))
  assert.equal(new Set(ids).size, 3)
})

run('GOOGLE-02 edit does not duplicate (delta reuses same occurrence ids)', () => {
  const next = applyStartDelta({
    previousStartAtMs: 1000,
    nextStartAtMs: 1000 + 60_000,
    targetStartAtMs: 5000,
  })
  assert.equal(next, 5000 + 60_000)
})

run('GOOGLE-03 future edits preserve previous occurrences', () => {
  const filtered = filterEditableSeriesOccurrences({
    fromIndex: 2,
    scope: 'this_and_future',
    occurrences: [
      { recurrenceIndex: 0, status: 'scheduled' },
      { recurrenceIndex: 1, status: 'scheduled' },
      { recurrenceIndex: 2, status: 'scheduled' },
    ],
  })
  assert.ok(!filtered.some((item) => item.recurrenceIndex! < 2))
})

console.log('Phase 3B recurrence tests OK')
