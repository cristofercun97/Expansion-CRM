/**
 * Phase 2A unit tests: groups, reschedule transitions, results.
 * Uses modules without path aliases so tsx can run them.
 */
import assert from 'node:assert/strict'
import {
  assertCanTransitionMeetingStatus,
  canTransitionMeetingStatus,
  deriveParticipantUserIds,
} from '../src/features/agenda/utils/meetingAccess.ts'
import {
  assertParticipantsWithinGroup,
  buildGroupParticipantsFromMembers,
  mapActiveMembersExcludingOrganizer,
} from '../src/features/agenda/utils/meetingGroupUtils.ts'
import type { TeamMember } from '../src/features/team/types/team.types.ts'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

run('GROUP-01 whole group participantUserIds', () => {
  const members = [
    { userId: 'u1', name: 'Ana', email: 'a@x.com' },
    { userId: 'u2', name: 'Luis' },
  ]
  const participants = buildGroupParticipantsFromMembers(members)
  const ids = deriveParticipantUserIds(participants, 'ORG')
  assert.deepEqual(ids, ['u1', 'u2'])
})

run('GROUP-02 partial selection', () => {
  const members = [
    { userId: 'u1', name: 'Ana', email: 'a@x.com' },
    { userId: 'u2', name: 'Luis', email: 'l@x.com' },
    { userId: 'u3', name: 'Marta' },
  ]
  const participants = buildGroupParticipantsFromMembers(members, ['u1', 'u3'])
  assert.equal(participants.length, 2)
  assert.deepEqual(deriveParticipantUserIds(participants, 'ORG'), ['u1', 'u3'])
})

run('GROUP-04 non-invited member not in participantUserIds', () => {
  const participants = buildGroupParticipantsFromMembers(
    [{ userId: 'u1', name: 'Ana' }],
    ['u1'],
  )
  const ids = deriveParticipantUserIds(participants, 'ORG')
  assert.ok(!ids.includes('u9'))
})

run('GROUP-07 no-email members stay as internal participants', () => {
  const participants = buildGroupParticipantsFromMembers([
    { userId: 'u1', name: 'Sin email' },
    { userId: 'u2', name: 'Con email', email: 'b@x.com' },
  ])
  assert.equal(participants[0]?.email, undefined)
  assert.equal(participants[1]?.email, 'b@x.com')
  const attendeeEmails = participants
    .map((item) => item.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email))
  assert.deepEqual(attendeeEmails, ['b@x.com'])
})

run('GROUP organizer excluded from participantUserIds', () => {
  const ids = deriveParticipantUserIds(
    [
      { type: 'user', userId: 'ORG', name: 'Yo' },
      { type: 'user', userId: 'u1', name: 'Otro' },
    ],
    'ORG',
  )
  assert.deepEqual(ids, ['u1'])
})

run('GROUP assertParticipantsWithinGroup rejects outsiders', () => {
  assert.throws(() =>
    assertParticipantsWithinGroup(
      [{ type: 'user', userId: 'outsider', name: 'X' }],
      new Set(['u1']),
    ),
  )
})

run('GROUP mapActiveMembersExcludingOrganizer', () => {
  const members = [
    {
      id: '1',
      teamId: 't1',
      ownerUid: 'ORG',
      memberUid: 'ORG',
      memberName: 'Owner',
      role: 'owner',
      status: 'active',
      joinedAt: null,
      createdAt: null,
      updatedAt: null,
    },
    {
      id: '2',
      teamId: 't1',
      ownerUid: 'ORG',
      memberUid: 'u1',
      memberName: 'Member',
      memberEmail: 'm@x.com',
      role: 'member',
      status: 'active',
      joinedAt: null,
      createdAt: null,
      updatedAt: null,
    },
  ] as TeamMember[]

  const mapped = mapActiveMembersExcludingOrganizer(members, 'ORG')
  assert.equal(mapped.length, 1)
  assert.equal(mapped[0]?.userId, 'u1')
})

run('RESCHEDULE transition stays scheduled', () => {
  assert.equal(canTransitionMeetingStatus('scheduled', 'scheduled'), true)
})

run('RESULT transitions from scheduled', () => {
  assert.equal(canTransitionMeetingStatus('scheduled', 'completed'), true)
  assert.equal(canTransitionMeetingStatus('scheduled', 'no_show'), true)
  assert.equal(canTransitionMeetingStatus('scheduled', 'cancelled'), true)
})

run('RESULT-05 completed cannot return to scheduled', () => {
  assert.equal(canTransitionMeetingStatus('completed', 'scheduled'), false)
  assert.throws(() => assertCanTransitionMeetingStatus('cancelled', 'completed'))
  assert.throws(() => assertCanTransitionMeetingStatus('no_show', 'scheduled'))
})

console.log('Agenda phase 2a tests: PASS')
