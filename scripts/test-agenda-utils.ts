import assert from 'node:assert/strict'
import {
  canManageMeeting,
  deriveParticipantUserIds,
  isMeetingParticipant,
} from '../src/features/agenda/utils/meetingAccess.ts'
import {
  addMinutes,
  combineLocalDateAndTime,
  getMonthCalendarDays,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from '../src/features/agenda/utils/meetingDateUtils.ts'

function testCombineLocalDateAndTime() {
  const value = combineLocalDateAndTime('2026-09-15', '17:00')
  assert.ok(value)
  assert.equal(value.getFullYear(), 2026)
  assert.equal(value.getMonth(), 8)
  assert.equal(value.getDate(), 15)
  assert.equal(value.getHours(), 17)
  assert.equal(value.getMinutes(), 0)
  assert.equal(combineLocalDateAndTime('bad', '17:00'), null)
}

function testAddMinutes() {
  const start = combineLocalDateAndTime('2026-09-15', '17:00')
  assert.ok(start)
  const end = addMinutes(start, 30)
  assert.equal(end.getHours(), 17)
  assert.equal(end.getMinutes(), 30)
}

function testWeekStartMonday() {
  const wednesday = new Date(2026, 8, 9, 12, 0, 0)
  const monday = startOfWeek(wednesday)
  assert.equal(monday.getDay(), 1)
  assert.ok(isSameDay(monday, new Date(2026, 8, 7)))
}

function testNoDuplicateMeetOnTimezoneEdge() {
  const start = combineLocalDateAndTime('2026-09-15', '23:45')
  assert.ok(start)
  const end = addMinutes(start, 30)
  assert.equal(end.getDate(), 16)
  assert.equal(end.getHours(), 0)
  assert.equal(end.getMinutes(), 15)
}

function testMonthCalendarGrid() {
  const september = startOfMonth(new Date(2026, 8, 1))
  const days = getMonthCalendarDays(september)
  assert.ok(days.length >= 28)
  assert.equal(days[0]?.getDay(), 1)
  assert.equal(days[days.length - 1]?.getDay(), 0)
  assert.ok(days.some((day) => day.getMonth() === 8 && day.getDate() === 15))
}

function testParticipantUserIdsFromUidsOnly() {
  const ids = deriveParticipantUserIds([
    { type: 'user', userId: 'UID_B', name: 'B', email: 'b@example.com' },
    { type: 'user', userId: 'UID_A', name: 'A' },
    { type: 'user', userId: 'UID_B', name: 'B duplicate' },
    { type: 'contact', contactId: 'c1', name: 'Contact', email: 'c@example.com' },
    { type: 'external', name: 'Ext', email: 'e@example.com' },
    { type: 'user', name: 'Missing uid' },
  ])

  assert.deepEqual(ids, ['UID_A', 'UID_B'])
}

function testAccessMatrix() {
  const organizerId = 'USER_A'
  const participantId = 'USER_B'
  const strangerId = 'USER_C'
  const participantUserIds = ['USER_B']

  assert.equal(
    canManageMeeting({ meetingOrganizerId: organizerId, currentUserId: organizerId, isAdmin: false }),
    true,
  )
  assert.equal(
    canManageMeeting({ meetingOrganizerId: organizerId, currentUserId: participantId, isAdmin: false }),
    false,
  )
  assert.equal(
    canManageMeeting({ meetingOrganizerId: organizerId, currentUserId: strangerId, isAdmin: false }),
    false,
  )
  assert.equal(
    canManageMeeting({ meetingOrganizerId: organizerId, currentUserId: strangerId, isAdmin: true }),
    true,
  )

  assert.equal(
    isMeetingParticipant({
      meetingOrganizerId: organizerId,
      participantUserIds,
      currentUserId: organizerId,
    }),
    true,
  )
  assert.equal(
    isMeetingParticipant({
      meetingOrganizerId: organizerId,
      participantUserIds,
      currentUserId: participantId,
    }),
    true,
  )
  assert.equal(
    isMeetingParticipant({
      meetingOrganizerId: organizerId,
      participantUserIds,
      currentUserId: strangerId,
    }),
    false,
  )
}

testCombineLocalDateAndTime()
testAddMinutes()
testWeekStartMonday()
testNoDuplicateMeetOnTimezoneEdge()
testMonthCalendarGrid()
testParticipantUserIdsFromUidsOnly()
testAccessMatrix()

console.log('Agenda utils tests: PASS')
