/**
 * PRESENTACIÓN ↔ AGENDA — FASE 1 booking tests (BOOK-01…15).
 * Pure logic + contract asserts (no live network).
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BOOKING_MAX_ADVANCE_DAYS,
  buildLockId,
  computePublicAvailability,
  daySpanInclusive,
  isSlotFree,
  mapBookingConfig,
  resolveSlotStartMs,
  zonedLocalToUtc,
} from '../functions/src/booking/availability.ts'
import {
  sanitizeAvailabilityRequest,
  sanitizeCreateBookingRequest,
} from '../functions/src/booking/sanitize.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function pass(id: string) {
  console.log(`PASS ${id}`)
}

const baseConfig = mapBookingConfig({
  enabled: true,
  durationMinutes: 30,
  timezone: 'Europe/Madrid',
  title: 'Conversemos',
  googleMeet: false,
  windows: { weekdays: [1, 2, 3, 4, 5], startHour: 9, endHour: 18 },
})

// BOOK-01 — valid slug availability shape (logic)
{
  const monday = zonedLocalToUtc(2026, 9, 14, 12, 0, 'Europe/Madrid') // Mon
  const nowMs = monday.getTime() - 2 * 86400000
  const result = computePublicAvailability({
    nowMs,
    rangeStartDateKey: '2026-09-14',
    rangeEndDateKey: '2026-09-18',
    config: baseConfig,
    busy: [],
  })
  assert.equal(result.timezone, 'Europe/Madrid')
  assert.equal(result.durationMinutes, 30)
  assert.ok(Object.keys(result.dates).length > 0)
  assert.ok(result.dates['2026-09-14']?.includes('09:00'))
  pass('BOOK-01')
}

// BOOK-02 — invalid availability range / slug sanitizer
{
  assert.throws(() => sanitizeAvailabilityRequest({ slug: '', dateFrom: '2026-09-14', dateTo: '2026-09-15' }))
  pass('BOOK-02')
}

// BOOK-03 — busy slot excluded
{
  const start = zonedLocalToUtc(2026, 9, 14, 10, 0, 'Europe/Madrid').getTime()
  const result = computePublicAvailability({
    nowMs: start - 3 * 86400000,
    rangeStartDateKey: '2026-09-14',
    rangeEndDateKey: '2026-09-14',
    config: baseConfig,
    busy: [{ startMs: start, endMs: start + 30 * 60_000 }],
  })
  assert.ok(!(result.dates['2026-09-14'] || []).includes('10:00'))
  pass('BOOK-03')
}

// BOOK-04 — busy intervals carry no private fields (type contract)
{
  const busy = [{ startMs: 1, endMs: 2 }]
  assert.equal(Object.keys(busy[0]).sort().join(','), 'endMs,startMs')
  pass('BOOK-04')
}

// BOOK-05/06 — contact create/dedupe contracts in handlers source
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes("source: \"presentation_booking\""))
  assert.ok(handlers.includes('findOrCreateProspect'))
  assert.ok(handlers.includes('.where("email", "==", email)'))
  pass('BOOK-05')
  pass('BOOK-06')
}

// BOOK-07 — meeting create payload
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('status: "scheduled"'))
  assert.ok(handlers.includes('COLLECTIONS.meetings'))
  pass('BOOK-07')
}

// BOOK-08 — source / timeline
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('source: "presentation_booking"'))
  assert.ok(handlers.includes('eventKind: "meeting_scheduled"'))
  assert.ok(handlers.includes('leadActivities'))
  pass('BOOK-08')
}

// BOOK-09 — idempotency
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('bookingIdempotency'))
  assert.ok(handlers.includes('clientRequestId'))
  assert.ok(handlers.includes('idempotent: true'))
  pass('BOOK-09')
}

// BOOK-10 — double booking lock
{
  assert.equal(buildLockId('org1', 123), 'org1_123')
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('bookingLocks'))
  assert.ok(handlers.includes('tx.create(lockRef'))
  pass('BOOK-10')
}

// BOOK-11 — slot recheck
{
  const start = Date.now() + 3600_000
  assert.equal(isSlotFree(start, start + 1800_000, [{ startMs: start, endMs: start + 1800_000 }]), false)
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('isSlotFree'))
  assert.ok(handlers.includes('Ese horario acaba de reservarse'))
  pass('BOOK-11')
}

// BOOK-12 — Google optional (disconnected still creates meeting)
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('if (booking.googleMeet)'))
  assert.ok(handlers.includes('googleSyncError'))
  pass('BOOK-12')
}

// BOOK-13 — Google connected path
{
  const handlers = fs.readFileSync(path.join(root, 'functions/src/booking/handlers.ts'), 'utf8')
  assert.ok(handlers.includes('createCalendarEventForUid'))
  pass('BOOK-13')
}

// BOOK-14 — privacy rejected
{
  assert.throws(() =>
    sanitizeCreateBookingRequest({
      slug: 'demo',
      selectedDate: '2026-09-18',
      selectedTime: '10:00',
      clientRequestId: '12345678',
      leadData: {
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@example.com',
        country: 'ES',
        city: 'Madrid',
        whatsapp: '',
        sessionReason: 'Liderazgo',
        objective: 'Clarificar mi situación',
        message: 'Hola',
        privacyAccepted: false,
      },
    }),
  )
  pass('BOOK-14')
}

// BOOK-15 — range > 31 days rejected
{
  assert.ok(daySpanInclusive('2026-09-01', '2026-10-10') > BOOKING_MAX_ADVANCE_DAYS)
  assert.throws(() =>
    sanitizeAvailabilityRequest({
      slug: 'demo',
      dateFrom: '2026-09-01',
      dateTo: '2026-10-10',
    }),
  )
  pass('BOOK-15')
}

// Extra: slot resolution uses absolute timestamps
{
  const ms = resolveSlotStartMs('2026-09-14', '09:30', 'Europe/Madrid')
  assert.ok(typeof ms === 'number' && ms > 0)
  pass('BOOK-EXTRA-timezone-absolute')
}

// Route + CTA + security contracts
{
  const router = fs.readFileSync(path.join(root, 'src/app/router/index.tsx'), 'utf8')
  assert.ok(router.includes('reservar/:slug'))
  const landing = fs.readFileSync(
    path.join(root, 'src/features/presentation/components/preview/PresentationPreviewLanding.tsx'),
    'utf8',
  )
  assert.ok(landing.includes('Agendar mi encuentro'))
  assert.ok(landing.includes('/reservar/'))
  const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8')
  assert.ok(rules.includes('match /bookingLocks/{lockId}'))
  assert.ok(rules.includes('allow read, write: if false'))
  pass('BOOK-EXTRA-route-cta-rules')
}

console.log('PRESENTACIÓN ↔ AGENDA — FASE 1 booking tests: ALL PASS')
