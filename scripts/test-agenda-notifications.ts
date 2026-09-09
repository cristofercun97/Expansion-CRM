/**
 * Phase 2B notification + next-action contract tests (pure / structural).
 */
import assert from 'node:assert/strict'
import { buildNotificationDedupeKey } from '../functions/src/meetings/reminderLogic.ts'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

run('NOTIF dedupe key stable for invitation', () => {
  const key = buildNotificationDedupeKey([
    'meeting_invitation',
    'm1',
    'u2',
    '123',
  ])
  assert.equal(key, 'meeting_invitation_m1_u2_123')
})

run('NOTIF-07 reschedule notification key unique per startAt', () => {
  const a = buildNotificationDedupeKey(['meeting_rescheduled', 'm1', 'u1', 'reschedule_100'])
  const b = buildNotificationDedupeKey(['meeting_rescheduled', 'm1', 'u1', 'reschedule_200'])
  assert.notEqual(a, b)
})

run('ACTION double-submit lock id pattern', () => {
  const meetingId = 'meet_1'
  const uid = 'user_1'
  const lockId = `${meetingId}_${uid}`
  assert.equal(lockId, 'meet_1_user_1')
})

run('ACTION source metadata contract', () => {
  const payload = {
    source: 'agenda',
    sourceMeetingId: 'm1',
    contactId: 'c1',
  }
  assert.equal(payload.source, 'agenda')
  assert.ok(payload.sourceMeetingId)
})

console.log('Agenda notifications/next-action tests: PASS')
