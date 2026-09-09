/**
 * Phase 2B reminder scheduling pure logic tests.
 */
import assert from 'node:assert/strict'
import {
  buildReminderDedupeKey,
  computeReminderSlots,
  formatReminderCopy,
  resolveReminderRecipients,
  shouldSuppressReminders,
} from '../functions/src/meetings/reminderLogic.ts'

function run(name: string, fn: () => void) {
  try {
    fn()
    console.log('PASS', name)
  } catch (error) {
    console.error('FAIL', name)
    throw error
  }
}

const HOUR = 60 * 60 * 1000
const now = Date.UTC(2026, 8, 9, 12, 0, 0)

run('REM-01 Meeting +48h creates 24h + 1h + 10m', () => {
  const start = now + 48 * HOUR
  const slots = computeReminderSlots({ meetingStartAtMs: start, nowMs: now })
  assert.deepEqual(
    slots.map((s) => s.reminderType),
    ['24h', '1h', '10m'],
  )
  assert.equal(slots[0]!.scheduledForMs, start - 24 * HOUR)
})

run('REM-02 Meeting +3h creates 1h + 10m', () => {
  const start = now + 3 * HOUR
  const slots = computeReminderSlots({ meetingStartAtMs: start, nowMs: now })
  assert.deepEqual(
    slots.map((s) => s.reminderType),
    ['1h', '10m'],
  )
})

run('REM-03 Meeting +30m creates 10m', () => {
  const start = now + 30 * 60 * 1000
  const slots = computeReminderSlots({ meetingStartAtMs: start, nowMs: now })
  assert.deepEqual(
    slots.map((s) => s.reminderType),
    ['10m'],
  )
})

run('REM-04 Meeting +5m creates no past reminders', () => {
  const start = now + 5 * 60 * 1000
  const slots = computeReminderSlots({ meetingStartAtMs: start, nowMs: now })
  assert.equal(slots.length, 0)
})

run('REM-05 dedupe key is deterministic', () => {
  const key = buildReminderDedupeKey({
    meetingId: 'm1',
    recipientUid: 'u1',
    reminderType: '1h',
    meetingStartAtMs: 1000,
  })
  assert.equal(key, 'm1_u1_1h_1000')
})

run('REM-PART-03/04 organizer included once', () => {
  const recipients = resolveReminderRecipients({
    organizerId: 'ORG',
    participantUserIds: ['ORG', 'A', 'B', 'A'],
  })
  assert.deepEqual(recipients, ['A', 'B', 'ORG'])
})

run('REM-07/08/09 suppress cancelled completed no_show', () => {
  assert.equal(shouldSuppressReminders('cancelled'), true)
  assert.equal(shouldSuppressReminders('completed'), true)
  assert.equal(shouldSuppressReminders('no_show'), true)
  assert.equal(shouldSuppressReminders('scheduled'), false)
})

run('REM copy 24h / 1h / 10m', () => {
  assert.equal(
    formatReminderCopy({ reminderType: '24h', title: 'Kickoff', timeLabel: 'mañana' }).title,
    'Tu reunión es mañana',
  )
  assert.equal(
    formatReminderCopy({ reminderType: '1h', title: 'Kickoff', timeLabel: 'hoy' }).title,
    'Tu reunión comienza en 1 hora',
  )
  assert.equal(
    formatReminderCopy({ reminderType: '10m', title: 'Kickoff', timeLabel: 'hoy' }).title,
    'Tu reunión comienza en 10 minutos',
  )
})

run('REM-RES timezone uses absolute ms offsets', () => {
  const start = Date.UTC(2026, 2, 29, 15, 0, 0) // near DST
  const slots = computeReminderSlots({ meetingStartAtMs: start, nowMs: start - 50 * HOUR })
  assert.equal(slots.find((s) => s.reminderType === '24h')!.scheduledForMs, start - 24 * HOUR)
})

console.log('Agenda reminder tests: PASS')
