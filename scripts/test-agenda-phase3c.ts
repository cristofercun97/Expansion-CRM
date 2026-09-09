/**
 * Agenda Phase 3C — metrics pure logic tests.
 */
import assert from 'node:assert/strict'
import {
  TEAM_AGENDA_MAX_RANGE_DAYS,
  assertTeamAgendaRange,
  canUserViewTeamAgenda,
  parseTeamAgendaRangeInput,
} from '../functions/src/meetings/teamAgendaLogic.ts'
import {
  assertTeamMetricsDtoSanitized,
  calculateAgendaPersonalKpis,
  computeAttendanceRate,
  formatAttendanceRate,
  getAgendaMetricsRange,
  selectUpcomingMeetings,
  aggregateTeamMemberMetrics,
} from '../functions/src/meetings/agendaMetricsLogic.ts'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

run('METRIC-01 counts por status', () => {
  const kpis = calculateAgendaPersonalKpis({
    rangeStartMs: 0,
    rangeEndMs: 1000,
    meetings: [
      { id: '1', status: 'scheduled', startAtMs: 10 },
      { id: '2', status: 'completed', startAtMs: 20 },
      { id: '3', status: 'completed', startAtMs: 30 },
      { id: '4', status: 'no_show', startAtMs: 40 },
      { id: '5', status: 'cancelled', startAtMs: 50 },
      { id: '6', status: 'rescheduled', startAtMs: 60 },
    ],
  })
  assert.equal(kpis.scheduledCount, 1)
  assert.equal(kpis.completedCount, 2)
  assert.equal(kpis.noShowCount, 1)
  assert.equal(kpis.cancelledCount, 1)
})

run('METRIC-02 attendance rate', () => {
  assert.equal(computeAttendanceRate(3, 1), 75)
  assert.equal(formatAttendanceRate(75), '75%')
  assert.equal(computeAttendanceRate(1, 2), 33.3)
  assert.equal(formatAttendanceRate(33.3), '33.3%')
})

run('METRIC-03 denominator cero', () => {
  assert.equal(computeAttendanceRate(0, 0), null)
  assert.equal(formatAttendanceRate(null), '—')
  const kpis = calculateAgendaPersonalKpis({
    rangeStartMs: 0,
    rangeEndMs: 100,
    meetings: [{ id: '1', status: 'scheduled', startAtMs: 10 }],
  })
  assert.equal(kpis.attendanceRate, null)
})

run('METRIC-04 rango temporal', () => {
  const week = getAgendaMetricsRange('week', Date.parse('2026-09-10T12:00:00'))
  assert.ok(week.rangeStart.getTime() <= Date.parse('2026-09-10T12:00:00'))
  assert.ok(week.rangeEnd.getTime() >= Date.parse('2026-09-10T12:00:00'))

  const kpis = calculateAgendaPersonalKpis({
    rangeStartMs: 100,
    rangeEndMs: 200,
    meetings: [
      { id: 'in', status: 'completed', startAtMs: 150 },
      { id: 'out', status: 'completed', startAtMs: 250 },
    ],
  })
  assert.equal(kpis.completedCount, 1)
})

run('METRIC-05 recurrentes cuentan occurrences', () => {
  const kpis = calculateAgendaPersonalKpis({
    rangeStartMs: 0,
    rangeEndMs: 1000,
    meetings: [
      { id: 's_0', status: 'scheduled', startAtMs: 10 },
      { id: 's_1', status: 'scheduled', startAtMs: 20 },
      { id: 's_2', status: 'completed', startAtMs: 30 },
      { id: 's_3', status: 'completed', startAtMs: 40 },
    ],
  })
  assert.equal(kpis.scheduledCount + kpis.completedCount, 4)
})

run('METRIC-06 next actions solo source=agenda', () => {
  const kpis = calculateAgendaPersonalKpis({
    rangeStartMs: 0,
    rangeEndMs: 100,
    meetings: [
      { id: 'm1', status: 'completed', startAtMs: 10 },
      { id: 'm2', status: 'completed', startAtMs: 20 },
    ],
    tasks: [
      { id: 't1', source: 'agenda', sourceMeetingId: 'm1' },
      { id: 't2', source: 'manual', sourceMeetingId: 'm2' },
      { id: 't3', source: 'agenda', sourceMeetingId: 'other' },
      { id: 't4', source: 'agenda', sourceMeetingId: 'm2' },
    ],
  })
  assert.equal(kpis.nextActionsCount, 2)
})

run('METRIC-07 próximas reuniones máximo 5 + orden', () => {
  const now = 1000
  const upcoming = selectUpcomingMeetings(
    [
      { id: 'a', status: 'scheduled', startAtMs: 1300, title: 'A' },
      { id: 'b', status: 'scheduled', startAtMs: 1100, title: 'B' },
      { id: 'c', status: 'scheduled', startAtMs: 1200, title: 'C' },
      { id: 'd', status: 'scheduled', startAtMs: 1400, title: 'D' },
      { id: 'e', status: 'scheduled', startAtMs: 1500, title: 'E' },
      { id: 'f', status: 'scheduled', startAtMs: 1600, title: 'F' },
      { id: 'past', status: 'scheduled', startAtMs: 900, title: 'Past' },
      { id: 'done', status: 'completed', startAtMs: 1250, title: 'Done' },
    ],
    { nowMs: now, rangeStartMs: 0, rangeEndMs: 10_000, limit: 5 },
  )
  assert.equal(upcoming.length, 5)
  assert.deepEqual(
    upcoming.map((item) => item.id),
    ['b', 'c', 'a', 'd', 'e'],
  )
})

run('TEAM-01 owner obtiene agregados', () => {
  assert.equal(canUserViewTeamAgenda({ uid: 'OWNER', teamOwnerUid: 'OWNER' }), true)
  const row = aggregateTeamMemberMetrics({
    memberUid: 'M1',
    displayName: 'María',
    statuses: ['scheduled', 'completed', 'no_show', 'cancelled'],
  })
  assert.equal(row.scheduledCount, 1)
  assert.equal(row.completedCount, 1)
  assert.equal(row.attendanceRate, 50)
})

run('TEAM-02 regular member denied', () => {
  assert.equal(canUserViewTeamAgenda({ uid: 'MEMBER', teamOwnerUid: 'OWNER' }), false)
})

run('TEAM-03 foreign team denied', () => {
  assert.equal(canUserViewTeamAgenda({ uid: 'OWNER_A', teamOwnerUid: 'OWNER_B' }), false)
})

run('TEAM-04 DTO sin información privada', () => {
  const row = aggregateTeamMemberMetrics({
    memberUid: 'M1',
    displayName: 'María',
    statuses: ['completed'],
  })
  assertTeamMetricsDtoSanitized(row as unknown as Record<string, unknown>)
  assert.equal('title' in row, false)
  assert.equal('meetingUrl' in row, false)
  assert.equal('emails' in row, false)
})

run('TEAM-05 rango >31d denied', () => {
  assert.equal(TEAM_AGENDA_MAX_RANGE_DAYS, 31)
  assert.throws(
    () =>
      parseTeamAgendaRangeInput({
        rangeStartIso: '2026-09-01T00:00:00.000Z',
        rangeEndIso: '2026-10-15T00:00:00.000Z',
      }),
    /RANGE_TOO_LARGE/,
  )
  assert.doesNotThrow(() =>
    assertTeamAgendaRange({
      rangeStartMs: Date.parse('2026-09-01T00:00:00.000Z'),
      rangeEndMs: Date.parse('2026-09-30T23:59:59.000Z'),
    }),
  )
})

console.log('Phase 3C metrics tests OK')
