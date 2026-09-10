/**
 * Firestore Rules gate — public booking stores (Fase 1).
 * Run: npm run test:presentation-booking-rules
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

const PROJECT_ID = 'expansion-booking-rules-test'
const RULES_PATH = resolve(process.cwd(), 'firestore.rules')

const OWNER = 'OWNER_A'
const STRANGER = 'STRANGER_B'
const ADMIN = 'ADMIN_USER'

function auth(testEnv: RulesTestEnvironment, uid: string) {
  return testEnv.authenticatedContext(uid, { email_verified: true })
}

async function seed(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc(`users/${OWNER}`).set({ role: 'usuario', email: 'owner@example.com' })
    await db.doc(`users/${STRANGER}`).set({ role: 'usuario', email: 'stranger@example.com' })
    await db.doc(`users/${ADMIN}`).set({ role: 'admin', email: 'admin@example.com' })

    await db.doc('meetings/m_private').set({
      title: 'Sesión privada con María',
      type: 'follow_up',
      description: '',
      notes: '',
      resultNotes: '',
      status: 'scheduled',
      startAt: new Date('2026-09-15T10:00:00.000Z'),
      endAt: new Date('2026-09-15T10:30:00.000Z'),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      organizerId: OWNER,
      organizerName: 'Owner',
      contactId: 'c1',
      meetingAudience: 'individual',
      groupId: null,
      participants: [],
      participantUserIds: [],
      meetingProvider: 'none',
      googleCalendarEventId: null,
      googleCalendarHtmlLink: null,
      googleMeetUrl: null,
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-01T10:00:00.000Z'),
      createdBy: OWNER,
      updatedBy: OWNER,
      completedAt: null,
      cancelledAt: null,
    })

    await db.doc('notifications/n1').set({
      recipientUid: OWNER,
      type: 'meeting_reminder',
      title: 'Recordatorio',
      body: 'En 1 hora',
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      readAt: null,
    })

    await db.doc('prospects/p1').set({
      ownerUid: OWNER,
      leaderId: OWNER,
      landingSlug: 'demo',
      source: 'presentation_landing',
      status: 'new',
      name: 'Lead',
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-01T10:00:00.000Z'),
    })

    await db.doc('bookingLocks/OWNER_A_123').set({
      organizerId: OWNER,
      startAtMs: 123,
      meetingId: 'm1',
    })
    await db.doc('bookingIdempotency/idem1').set({
      organizerId: OWNER,
      bookingId: 'm1',
      clientRequestId: 'req-1',
    })
    await db.doc('bookingRateLimits/ip_x_2026-09-10').set({
      count: 1,
    })

    await db.doc('presentationFunnelEvents/booking_completed_m1').set({
      eventKind: 'booking_completed',
      presentationSlug: 'demo',
      ownerUid: OWNER,
      bookingId: 'm1',
      source: 'presentation_booking',
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
    })
  })
}

async function assertDeniedCrud(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  path: string,
  payload: Record<string, unknown>,
) {
  await assertFails(db.doc(path).get())
  await assertFails(db.doc(path).set(payload))
  await assertFails(db.doc(path).update({ touched: true }))
  await assertFails(db.doc(path).delete())
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })

  try {
    await testEnv.clearFirestore()
    await seed(testEnv)

    const unauth = testEnv.unauthenticatedContext().firestore()
    const owner = auth(testEnv, OWNER).firestore()
    const stranger = auth(testEnv, STRANGER).firestore()
    const admin = auth(testEnv, ADMIN).firestore()

    const lockPayload = { organizerId: OWNER, startAtMs: 999, meetingId: 'x' }
    const idemPayload = { organizerId: OWNER, bookingId: 'x', clientRequestId: 'y' }
    const ratePayload = { count: 1 }

    // bookingLocks — all client actors denied
    await assertDeniedCrud(unauth, 'bookingLocks/new_lock', lockPayload)
    await assertDeniedCrud(owner, 'bookingLocks/OWNER_A_123', lockPayload)
    await assertDeniedCrud(stranger, 'bookingLocks/OWNER_A_123', lockPayload)
    await assertDeniedCrud(admin, 'bookingLocks/OWNER_A_123', lockPayload)
    console.log('PASS bookingLocks DENY CRUD (unauth/owner/stranger/admin)')

    // bookingIdempotency
    await assertDeniedCrud(unauth, 'bookingIdempotency/new_idem', idemPayload)
    await assertDeniedCrud(owner, 'bookingIdempotency/idem1', idemPayload)
    await assertDeniedCrud(stranger, 'bookingIdempotency/idem1', idemPayload)
    await assertDeniedCrud(admin, 'bookingIdempotency/idem1', idemPayload)
    console.log('PASS bookingIdempotency DENY CRUD')

    // bookingRateLimits
    await assertDeniedCrud(unauth, 'bookingRateLimits/new_rate', ratePayload)
    await assertDeniedCrud(owner, 'bookingRateLimits/ip_x_2026-09-10', ratePayload)
    await assertDeniedCrud(stranger, 'bookingRateLimits/ip_x_2026-09-10', ratePayload)
    await assertDeniedCrud(admin, 'bookingRateLimits/ip_x_2026-09-10', ratePayload)
    console.log('PASS bookingRateLimits DENY CRUD')

    // presentationFunnelEvents — backend-only (Fase 3)
    const funnelPayload = {
      eventKind: 'presentation_view',
      presentationSlug: 'demo',
      ownerUid: OWNER,
      source: 'presentation',
    }
    await assertDeniedCrud(unauth, 'presentationFunnelEvents/new_evt', funnelPayload)
    await assertDeniedCrud(owner, 'presentationFunnelEvents/booking_completed_m1', funnelPayload)
    await assertDeniedCrud(stranger, 'presentationFunnelEvents/booking_completed_m1', funnelPayload)
    await assertDeniedCrud(admin, 'presentationFunnelEvents/booking_completed_m1', funnelPayload)
    console.log('PASS presentationFunnelEvents DENY CRUD (unauth/owner/stranger/admin)')

    // Public direct access to meetings/prospects still denied for unauth
    await assertFails(unauth.doc('meetings/m_private').get())
    await assertFails(unauth.doc('prospects/p1').get())
    await assertFails(
      unauth.doc('meetings/public_inject').set({
        title: 'hack',
        organizerId: OWNER,
        status: 'scheduled',
      }),
    )
    console.log('PASS public direct meetings/prospects DENIED')

    // Meetings regression
    await assertSucceeds(owner.doc('meetings/m_private').get())
    await assertFails(stranger.doc('meetings/m_private').get())
    await assertSucceeds(admin.doc('meetings/m_private').get())
    console.log('PASS meetings regression')

    // Notifications regression
    await assertSucceeds(owner.doc('notifications/n1').get())
    await assertFails(stranger.doc('notifications/n1').get())
    console.log('PASS notifications regression')

    // Contacts/prospects regression — owner/leader can read; stranger cannot
    await assertSucceeds(owner.doc('prospects/p1').get())
    await assertFails(stranger.doc('prospects/p1').get())
    await assertFails(unauth.doc('prospects/p1').update({ status: 'contacted' }))
    console.log('PASS contacts/prospects regression')

    console.log('PRESENTATION BOOKING RULES GATE: ALL PASS')
  } finally {
    await testEnv.cleanup()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
