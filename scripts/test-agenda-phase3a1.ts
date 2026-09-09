/**
 * Agenda Phase 3A.1 — secure team agenda projection tests.
 */
import assert from 'node:assert/strict'
import {
  TEAM_AGENDA_FORBIDDEN_FIELDS,
  TEAM_AGENDA_MAX_RANGE_DAYS,
  assertSanitizedTeamAgendaSlot,
  assertTeamAgendaRange,
  buildTeamAgendaSlotsForMember,
  canUserViewTeamAgenda,
  describeTeamAgendaQueryPlan,
  mergeTeamAgendaSlots,
  parseTeamAgendaRangeInput,
  resolveTeamAgendaMemberUids,
  sanitizeTeamAgendaSlot,
  type TeamAgendaMeetingDoc,
} from '../functions/src/meetings/teamAgendaLogic.ts'

const OWNER_A = 'OWNER_A'
const MEMBER_A1 = 'MEMBER_A1'
const MEMBER_A2 = 'MEMBER_A2'
const MEMBER_B1 = 'MEMBER_B1'
const OWNER_B = 'OWNER_B'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

function meeting(partial: Partial<TeamAgendaMeetingDoc> & { id: string }): TeamAgendaMeetingDoc {
  const startAtMs = partial.startAtMs ?? Date.parse('2026-09-10T10:00:00.000Z')
  return {
    id: partial.id,
    organizerId: partial.organizerId ?? MEMBER_A1,
    participantUserIds: partial.participantUserIds ?? [],
    startAtMs,
    endAtMs: partial.endAtMs ?? startAtMs + 60 * 60_000,
    status: partial.status ?? 'scheduled',
    meetingMode: partial.meetingMode ?? 'video',
  }
}

run('TEAM-01 owner can view team agenda', () => {
  assert.equal(canUserViewTeamAgenda({ uid: OWNER_A, teamOwnerUid: OWNER_A }), true)
})

run('TEAM-02 regular member denied', () => {
  assert.equal(canUserViewTeamAgenda({ uid: MEMBER_A1, teamOwnerUid: OWNER_A }), false)
})

run('TEAM-03 foreign team denied', () => {
  assert.equal(canUserViewTeamAgenda({ uid: OWNER_A, teamOwnerUid: OWNER_B }), false)
})

run('TEAM-04 foreign memberUid denied', () => {
  assert.throws(
    () =>
      resolveTeamAgendaMemberUids({
        activeMemberUids: [OWNER_A, MEMBER_A1, MEMBER_A2],
        memberUid: MEMBER_B1,
      }),
    /FOREIGN_MEMBER/,
  )
})

run('TEAM-05 DTO never contains private fields', () => {
  const slot = sanitizeTeamAgendaSlot({
    meeting: meeting({
      id: 'm1',
      organizerId: MEMBER_A1,
    }),
    memberUid: MEMBER_A1,
  })
  assertSanitizedTeamAgendaSlot(slot as unknown as Record<string, unknown>)
  for (const key of TEAM_AGENDA_FORBIDDEN_FIELDS) {
    assert.equal(Object.prototype.hasOwnProperty.call(slot, key), false)
  }
  assert.equal('title' in slot, false)
  assert.equal('resultNotes' in slot, false)
  assert.equal('meetingUrl' in slot, false)
  assert.equal('googleMeetUrl' in slot, false)
  assert.equal('description' in slot, false)
  assert.equal('emails' in slot, false)
  assert.equal(slot.busy, true)
  assert.equal(slot.meetingMode, 'video')
})

run('TEAM-06 filter by member', () => {
  const members = resolveTeamAgendaMemberUids({
    activeMemberUids: [OWNER_A, MEMBER_A1, MEMBER_A2],
    memberUid: MEMBER_A2,
  })
  assert.deepEqual(members, [MEMBER_A2])
})

run('TEAM-07 temporal range validation', () => {
  const ok = assertTeamAgendaRange({
    rangeStartMs: Date.parse('2026-09-01T00:00:00.000Z'),
    rangeEndMs: Date.parse('2026-09-30T23:59:59.000Z'),
  })
  assert.ok(ok.spanDays <= TEAM_AGENDA_MAX_RANGE_DAYS)

  assert.throws(
    () =>
      parseTeamAgendaRangeInput({
        rangeStartIso: '2026-09-01T00:00:00.000Z',
        rangeEndIso: '2026-10-15T00:00:00.000Z',
      }),
    /RANGE_TOO_LARGE/,
  )
})

run('TEAM-08 meeting outside range excluded', () => {
  const rangeStartMs = Date.parse('2026-09-10T00:00:00.000Z')
  const rangeEndMs = Date.parse('2026-09-10T23:59:59.000Z')
  const slots = buildTeamAgendaSlotsForMember({
    memberUid: MEMBER_A1,
    rangeStartMs,
    rangeEndMs,
    meetings: [
      meeting({
        id: 'in',
        organizerId: MEMBER_A1,
        startAtMs: Date.parse('2026-09-10T10:00:00.000Z'),
      }),
      meeting({
        id: 'out',
        organizerId: MEMBER_A1,
        startAtMs: Date.parse('2026-09-11T10:00:00.000Z'),
      }),
    ],
  })
  assert.equal(slots.length, 1)
  assert.equal(slots[0]?.meetingId, 'in')
})

run('TEAM-09 leader participant keeps normal access path (personal meeting map)', () => {
  // Team DTO stays sanitized; personal agenda still holds full Meeting for shared access.
  const personalMeetingIds = new Set(['shared-1'])
  const slot = sanitizeTeamAgendaSlot({
    meeting: meeting({ id: 'shared-1', organizerId: MEMBER_A1 }),
    memberUid: MEMBER_A1,
  })
  assert.equal(personalMeetingIds.has(slot.meetingId), true)
  assert.equal('title' in slot, false)
})

run('TEAM-10 no global scan — per member + startAt range plan', () => {
  const plan = describeTeamAgendaQueryPlan({
    memberUids: [MEMBER_A1, MEMBER_A2],
    rangeStartMs: 1,
    rangeEndMs: 2,
  })
  assert.equal(plan.length, 2)
  for (const entry of plan) {
    assert.equal(entry.queries.length, 2)
    assert.match(entry.queries[0]!, /organizerId==/)
    assert.match(entry.queries[1]!, /participantUserIds array-contains/)
    assert.match(entry.queries[0]!, /startAt>=/)
    assert.equal(entry.queries.some((q) => q.includes('collection scan')), false)
  }
})

run('TEAM-SEC range / member merge smoke', () => {
  const slots = mergeTeamAgendaSlots([
    buildTeamAgendaSlotsForMember({
      memberUid: MEMBER_A1,
      rangeStartMs: Date.parse('2026-09-10T00:00:00.000Z'),
      rangeEndMs: Date.parse('2026-09-10T23:59:59.000Z'),
      meetings: [
        meeting({
          id: 'm-org',
          organizerId: MEMBER_A1,
          startAtMs: Date.parse('2026-09-10T09:00:00.000Z'),
        }),
        meeting({
          id: 'm-part',
          organizerId: MEMBER_A2,
          participantUserIds: [MEMBER_A1],
          startAtMs: Date.parse('2026-09-10T11:00:00.000Z'),
        }),
      ],
    }),
  ])
  assert.equal(slots.length, 2)
  assert.deepEqual(
    slots.map((s) => s.meetingId),
    ['m-org', 'm-part'],
  )
})

console.log('Phase 3A.1 team agenda tests OK')
