/**
 * Firestore Rules tests for Agenda meetings access.
 * Requires JDK 21+ and Firebase Emulator.
 * Run: npm run test:agenda-rules
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

const PROJECT_ID = 'expansion-agenda-rules-test'
const RULES_PATH = resolve(process.cwd(), 'firestore.rules')

const USER_A = 'USER_A'
const USER_B = 'USER_B'
const USER_C = 'USER_C'
const ADMIN = 'ADMIN_USER'
const MEETING_ID = 'meeting_ab'

function authContext(testEnv: RulesTestEnvironment, uid: string) {
  return testEnv.authenticatedContext(uid, {
    email_verified: true,
  })
}

async function seed(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc(`users/${USER_A}`).set({ role: 'usuario', email: 'a@example.com' })
    await db.doc(`users/${USER_B}`).set({ role: 'usuario', email: 'b@example.com' })
    await db.doc(`users/${USER_C}`).set({ role: 'usuario', email: 'c@example.com' })
    await db.doc(`users/${ADMIN}`).set({ role: 'admin', email: 'admin@example.com' })

    await db.doc(`meetings/${MEETING_ID}`).set({
      title: 'Seguimiento con María',
      type: 'follow_up',
      description: '',
      notes: '',
      resultNotes: '',
      status: 'scheduled',
      startAt: new Date('2026-09-15T17:00:00.000Z'),
      endAt: new Date('2026-09-15T17:30:00.000Z'),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      organizerId: USER_A,
      organizerName: 'Franklin',
      contactId: null,
      groupId: null,
      participants: [
        { type: 'user', userId: USER_B, name: 'Participante B', email: 'b@example.com' },
      ],
      participantUserIds: [USER_B],
      meetingProvider: 'google_meet',
      googleCalendarEventId: 'evt_original',
      googleCalendarHtmlLink: 'https://calendar.google.com/event?eid=original',
      googleMeetUrl: 'https://meet.google.com/aaa-bbbb-ccc',
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-01T10:00:00.000Z'),
      createdBy: USER_A,
      updatedBy: USER_A,
      completedAt: null,
      cancelledAt: null,
    })

    await db.doc(`googleCalendarConnections/${USER_A}`).set({
      email: 'a@example.com',
      refreshToken: 'secret-refresh',
      accessToken: 'secret-access',
    })

    await db.doc('googleOAuthStates/state_test_1').set({
      uid: USER_A,
      expiresAt: Date.now() + 60_000,
      used: false,
    })
  })
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

    const organizerDb = authContext(testEnv, USER_A).firestore()
    const participantDb = authContext(testEnv, USER_B).firestore()
    const strangerDb = authContext(testEnv, USER_C).firestore()
    const adminDb = authContext(testEnv, ADMIN).firestore()

    // READ matrix
    await assertSucceeds(organizerDb.doc(`meetings/${MEETING_ID}`).get())
    await assertSucceeds(participantDb.doc(`meetings/${MEETING_ID}`).get())
    await assertFails(strangerDb.doc(`meetings/${MEETING_ID}`).get())
    await assertSucceeds(adminDb.doc(`meetings/${MEETING_ID}`).get())

    // UPDATE matrix
    await assertSucceeds(
      organizerDb.doc(`meetings/${MEETING_ID}`).update({
        title: 'Seguimiento actualizado',
        updatedBy: USER_A,
        updatedAt: new Date(),
      }),
    )

    await assertSucceeds(
      adminDb.doc(`meetings/${MEETING_ID}`).update({
        notes: 'Nota admin',
        updatedBy: ADMIN,
        updatedAt: new Date(),
      }),
    )

    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        title: 'Hackeo participante',
        updatedBy: USER_B,
      }),
    )

    await assertFails(
      strangerDb.doc(`meetings/${MEETING_ID}`).update({
        title: 'Hackeo ajeno',
        updatedBy: USER_C,
      }),
    )

    // Field-level attacks — participant
    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        organizerId: USER_B,
        updatedBy: USER_B,
      }),
    )
    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        participantUserIds: [USER_B, USER_C],
        updatedBy: USER_B,
      }),
    )
    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        createdBy: USER_B,
        updatedBy: USER_B,
      }),
    )
    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        createdAt: new Date(),
        updatedBy: USER_B,
      }),
    )
    await assertFails(
      participantDb.doc(`meetings/${MEETING_ID}`).update({
        googleMeetUrl: 'https://meet.google.com/fake',
        googleCalendarEventId: 'fake-event',
        googleCalendarHtmlLink: 'https://calendar.google.com/fake',
        updatedBy: USER_B,
      }),
    )

    // Field-level attacks — stranger
    await assertFails(
      strangerDb.doc(`meetings/${MEETING_ID}`).update({
        organizerId: USER_C,
        participantUserIds: [USER_C],
        googleMeetUrl: 'https://meet.google.com/x',
        updatedBy: USER_C,
      }),
    )

    // Organizer cannot mutate immutable audit fields
    await assertFails(
      organizerDb.doc(`meetings/${MEETING_ID}`).update({
        organizerId: USER_C,
        updatedBy: USER_A,
      }),
    )
    await assertFails(
      organizerDb.doc(`meetings/${MEETING_ID}`).update({
        createdBy: USER_C,
        updatedBy: USER_A,
      }),
    )
    await assertFails(
      organizerDb.doc(`meetings/${MEETING_ID}`).update({
        createdAt: new Date('2030-01-01T00:00:00.000Z'),
        updatedBy: USER_A,
      }),
    )

    // DELETE — historical retention: only admin
    await assertFails(organizerDb.doc(`meetings/${MEETING_ID}`).delete())
    await assertFails(participantDb.doc(`meetings/${MEETING_ID}`).delete())
    await assertFails(strangerDb.doc(`meetings/${MEETING_ID}`).delete())
    await assertSucceeds(adminDb.doc(`meetings/${MEETING_ID}`).delete())

    // Token / OAuth collections — client denied
    await assertFails(organizerDb.doc(`googleCalendarConnections/${USER_A}`).get())
    await assertFails(organizerDb.doc(`googleCalendarConnections/${USER_A}`).set({ email: 'x' }))
    await assertFails(organizerDb.doc('googleOAuthStates/state_test_1').get())
    await assertFails(organizerDb.doc('googleOAuthStates/state_test_1').set({ used: true }))

    // Organizer can create
    await assertSucceeds(
      organizerDb.collection('meetings').add({
        title: 'Nueva reunión',
        type: 'follow_up',
        description: '',
        notes: '',
        resultNotes: '',
        status: 'scheduled',
        startAt: new Date('2026-09-16T17:00:00.000Z'),
        endAt: new Date('2026-09-16T17:30:00.000Z'),
        durationMinutes: 30,
        timezone: 'Europe/Madrid',
        organizerId: USER_A,
        organizerName: 'Franklin',
        contactId: null,
        groupId: null,
        participants: [{ type: 'user', userId: USER_B, name: 'B' }],
        participantUserIds: [USER_B],
        meetingProvider: 'none',
        googleCalendarEventId: null,
        googleCalendarHtmlLink: null,
        googleMeetUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: USER_A,
        updatedBy: USER_A,
        completedAt: null,
        cancelledAt: null,
      }),
    )

    console.log('Agenda Firestore rules tests: PASS')
    console.log('Matrix: organizer R/W OK | participant R-only | stranger deny | admin R/W/D OK')
    console.log('Field lock: organizerId/createdBy/createdAt immutable | Google fields participant-deny')
    console.log('Collections: googleCalendarConnections DENIED | googleOAuthStates DENIED')
  } finally {
    await testEnv.cleanup()
  }
}

main().catch((error) => {
  console.error('Agenda Firestore rules tests: FAIL')
  console.error(error)
  process.exitCode = 1
})
