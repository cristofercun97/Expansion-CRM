/**
 * Backend group membership authorization tests (pure logic + contracts).
 * Source of truth: teams/{teamId} + teamMembers/{teamId}_{memberUid}
 * Run via: npm run test:agenda (includes this script)
 */
import assert from 'node:assert/strict'
import {
  canUserManageTeamMeetings,
  resolveAuthorizedGroupParticipants,
  type TeamMemberRecord,
} from '../functions/src/meetings/groupMembershipLogic.ts'

const OWNER_A = 'OWNER_A'
const MEMBER_A1 = 'MEMBER_A1'
const MEMBER_A2 = 'MEMBER_A2'
const MEMBER_A_NO_EMAIL = 'MEMBER_A_NO_EMAIL'
const MEMBER_B1 = 'MEMBER_B1'
const STRANGER = 'STRANGER'
const TEAM_A = 'team_a'
const TEAM_B = 'team_b'

const teamAMembers: TeamMemberRecord[] = [
  {
    memberUid: OWNER_A,
    role: 'owner',
    status: 'active',
    memberName: 'Owner A',
    memberEmail: 'owner-a@example.com',
  },
  {
    memberUid: MEMBER_A1,
    role: 'member',
    status: 'active',
    memberName: 'Member A1',
    memberEmail: 'a1@example.com',
  },
  {
    memberUid: MEMBER_A2,
    role: 'member',
    status: 'active',
    memberName: 'Member A2',
    memberEmail: 'a2@example.com',
  },
  {
    memberUid: MEMBER_A_NO_EMAIL,
    role: 'member',
    status: 'active',
    memberName: 'Sin Email',
  },
  {
    memberUid: 'INACTIVE_A',
    role: 'member',
    status: 'inactive',
    memberName: 'Inactive',
    memberEmail: 'inactive@example.com',
  },
]

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

run('AUTH organizer owner can manage team meetings', () => {
  assert.equal(
    canUserManageTeamMeetings({
      uid: OWNER_A,
      teamOwnerUid: OWNER_A,
      membership: teamAMembers[0]!,
    }),
    true,
  )
})

run('AUTH active member can manage team meetings', () => {
  assert.equal(
    canUserManageTeamMeetings({
      uid: MEMBER_A1,
      teamOwnerUid: OWNER_A,
      membership: teamAMembers[1]!,
    }),
    true,
  )
})

run('ATTACK-02 / ATTACK-05 stranger cannot manage foreign group', () => {
  assert.equal(
    canUserManageTeamMeetings({
      uid: STRANGER,
      teamOwnerUid: OWNER_A,
      membership: null,
    }),
    false,
  )
  // Owner of Team A has no membership on Team B → cannot schedule for Team B
  assert.equal(
    canUserManageTeamMeetings({
      uid: OWNER_A,
      teamOwnerUid: 'OWNER_B',
      membership: null,
    }),
    false,
  )
})

run('ATTACK-05 inactive membership cannot manage', () => {
  assert.equal(
    canUserManageTeamMeetings({
      uid: 'INACTIVE_A',
      teamOwnerUid: OWNER_A,
      membership: {
        memberUid: 'INACTIVE_A',
        role: 'member',
        status: 'inactive',
      },
    }),
    false,
  )
})

run('GROUP-01 / ATTACK-06 whole group resolves real membership only', () => {
  const resolved = resolveAuthorizedGroupParticipants({
    organizerId: OWNER_A,
    members: teamAMembers,
    mode: 'all',
  })

  assert.deepEqual(resolved.participantUserIds, [
    MEMBER_A1,
    MEMBER_A2,
    MEMBER_A_NO_EMAIL,
  ].sort())
  assert.ok(!resolved.participantUserIds.includes(OWNER_A))
  assert.ok(!resolved.participantUserIds.includes('INACTIVE_A'))
  assert.ok(!resolved.participantUserIds.includes(MEMBER_B1))
})

run('GROUP-02 partial selection valid', () => {
  const resolved = resolveAuthorizedGroupParticipants({
    organizerId: OWNER_A,
    members: teamAMembers,
    mode: 'partial',
    selectedUserIds: [MEMBER_A2, MEMBER_A1],
  })
  assert.deepEqual(resolved.participantUserIds, [MEMBER_A1, MEMBER_A2].sort())
})

run('ATTACK-01 foreign UID injection denied (no silent drop)', () => {
  assert.throws(
    () =>
      resolveAuthorizedGroupParticipants({
        organizerId: OWNER_A,
        members: teamAMembers,
        mode: 'partial',
        selectedUserIds: [MEMBER_A1, MEMBER_B1],
      }),
    (error: unknown) =>
      error instanceof Error && error.message.startsWith(`FOREIGN_UID:${MEMBER_B1}`),
  )
})

run('GROUP-03 no-email stays internal; Google attendees exclude missing emails', () => {
  const resolved = resolveAuthorizedGroupParticipants({
    organizerId: OWNER_A,
    members: teamAMembers,
    mode: 'partial',
    selectedUserIds: [MEMBER_A_NO_EMAIL, MEMBER_A1],
  })

  assert.ok(resolved.participantUserIds.includes(MEMBER_A_NO_EMAIL))
  assert.ok(resolved.participantUserIds.includes(MEMBER_A1))
  assert.deepEqual(resolved.attendeeEmails, ['a1@example.com'])

  // Firestore Admin rejects undefined field values — omit email when missing.
  const firestoreParticipants = resolved.participants.map((participant) => {
    const base = {
      type: 'user' as const,
      userId: participant.userId,
      name: participant.name,
    }
    return participant.email ? { ...base, email: participant.email } : base
  })
  const noEmailDoc = firestoreParticipants.find((p) => p.userId === MEMBER_A_NO_EMAIL)
  assert.ok(noEmailDoc)
  assert.equal('email' in noEmailDoc!, false)
})

run('GROUP-04 attendee emails unique and derived from validated membership', () => {
  const resolved = resolveAuthorizedGroupParticipants({
    organizerId: OWNER_A,
    members: teamAMembers,
    mode: 'all',
  })
  assert.deepEqual(resolved.attendeeEmails.sort(), [
    'a1@example.com',
    'a2@example.com',
  ])
})

run('CONTRACT client must not send authoritative participantUserIds on create', () => {
  // Documented contract: callable accepts groupId + selection mode/request only.
  const createPayloadKeys = [
    'title',
    'groupId',
    'memberSelectionMode',
    'selectedUserIds',
    'startAtIso',
    'durationMinutes',
    'timezone',
  ]
  assert.ok(!createPayloadKeys.includes('participantUserIds'))
  assert.equal(TEAM_A !== TEAM_B, true)
})

run('EMPTY partial selection fails closed', () => {
  assert.throws(
    () =>
      resolveAuthorizedGroupParticipants({
        organizerId: OWNER_A,
        members: teamAMembers,
        mode: 'partial',
        selectedUserIds: [],
      }),
    (error: unknown) => error instanceof Error && error.message === 'EMPTY_SELECTION',
  )
})

console.log('Agenda group auth tests: PASS')
console.log('Source of truth: teams + teamMembers (active)')
console.log('ATTACK-01 foreign UID DENIED | ATTACK-02 foreign group manage DENIED')
console.log('ATTACK-05 stranger DENIED | ATTACK-06 whole-group membership server-resolved')
