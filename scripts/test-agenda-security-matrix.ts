/**
 * Security matrix for Agenda (USER_A organizer, USER_B participant, USER_C stranger).
 * Complements Firestore rules; full emulator suite is `npm run test:agenda-rules` (requires JDK 21+).
 */
import assert from 'node:assert/strict'
import {
  canManageMeeting,
  deriveParticipantUserIds,
  isMeetingParticipant,
} from '../src/features/agenda/utils/meetingAccess.ts'

const USER_A = 'USER_A'
const USER_B = 'USER_B'
const USER_C = 'USER_C'

function evaluateRulesRead(options: {
  uid: string
  isAdmin: boolean
  organizerId: string
  participantUserIds: string[]
}): boolean {
  if (options.isAdmin) {
    return true
  }

  if (options.uid === options.organizerId) {
    return true
  }

  return options.participantUserIds.includes(options.uid)
}

function evaluateRulesUpdate(options: {
  uid: string
  isAdmin: boolean
  organizerId: string
  preservesAudit: boolean
  changingProtectedFields: boolean
}): boolean {
  if (!options.preservesAudit) {
    return false
  }

  // Participants / strangers cannot update (including protected Google fields).
  if (options.isAdmin) {
    return true
  }

  if (options.uid === options.organizerId && !options.changingProtectedFields) {
    return true
  }

  // Organizer may change participantUserIds / google fields as part of manage flow.
  if (options.uid === options.organizerId) {
    return true
  }

  return false
}

function testMatrix() {
  const participantUserIds = deriveParticipantUserIds([
    { type: 'user', userId: USER_B, name: 'B', email: 'b@example.com' },
    { type: 'contact', contactId: 'c1', name: 'Contacto sin email' },
  ])
  assert.deepEqual(participantUserIds, [USER_B])

  // READ
  assert.equal(
    evaluateRulesRead({
      uid: USER_A,
      isAdmin: false,
      organizerId: USER_A,
      participantUserIds,
    }),
    true,
    'organizer READ',
  )
  assert.equal(
    evaluateRulesRead({
      uid: USER_B,
      isAdmin: false,
      organizerId: USER_A,
      participantUserIds,
    }),
    true,
    'participant READ',
  )
  assert.equal(
    evaluateRulesRead({
      uid: USER_C,
      isAdmin: false,
      organizerId: USER_A,
      participantUserIds,
    }),
    false,
    'stranger READ denied',
  )
  assert.equal(
    evaluateRulesRead({
      uid: USER_C,
      isAdmin: true,
      organizerId: USER_A,
      participantUserIds,
    }),
    true,
    'admin READ',
  )

  // UPDATE
  assert.equal(
    evaluateRulesUpdate({
      uid: USER_A,
      isAdmin: false,
      organizerId: USER_A,
      preservesAudit: true,
      changingProtectedFields: false,
    }),
    true,
    'organizer UPDATE',
  )
  assert.equal(
    evaluateRulesUpdate({
      uid: USER_B,
      isAdmin: false,
      organizerId: USER_A,
      preservesAudit: true,
      changingProtectedFields: false,
    }),
    false,
    'participant UPDATE denied',
  )
  assert.equal(
    evaluateRulesUpdate({
      uid: USER_B,
      isAdmin: false,
      organizerId: USER_A,
      preservesAudit: true,
      changingProtectedFields: true,
    }),
    false,
    'participant cannot change google/organizer/participantUserIds',
  )
  assert.equal(
    evaluateRulesUpdate({
      uid: USER_C,
      isAdmin: false,
      organizerId: USER_A,
      preservesAudit: true,
      changingProtectedFields: true,
    }),
    false,
    'stranger UPDATE denied',
  )
  assert.equal(
    evaluateRulesUpdate({
      uid: USER_C,
      isAdmin: false,
      organizerId: USER_A,
      preservesAudit: false,
      changingProtectedFields: true,
    }),
    false,
    'audit fields immutable',
  )

  assert.equal(
    canManageMeeting({ meetingOrganizerId: USER_A, currentUserId: USER_B, isAdmin: false }),
    false,
  )
  assert.equal(
    isMeetingParticipant({
      meetingOrganizerId: USER_A,
      participantUserIds,
      currentUserId: USER_B,
    }),
    true,
  )
}

testMatrix()
console.log('Agenda security matrix tests: PASS')
