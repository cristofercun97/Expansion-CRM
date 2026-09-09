/**
 * Firestore Rules tests for Agenda meetings access.
 *
 * Requires Java + Firestore emulator.
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

function authContext(testEnv: RulesTestEnvironment, uid: string, emailVerified = true) {
  return testEnv.authenticatedContext(uid, {
    email_verified: emailVerified,
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

    await assertSucceeds(organizerDb.doc(`meetings/${MEETING_ID}`).get())
    await assertSucceeds(participantDb.doc(`meetings/${MEETING_ID}`).get())
    await assertFails(strangerDb.doc(`meetings/${MEETING_ID}`).get())
    await assertSucceeds(adminDb.doc(`meetings/${MEETING_ID}`).get())

    await assertSucceeds(
      organizerDb.doc(`meetings/${MEETING_ID}`).update({
        title: 'Seguimiento actualizado',
        updatedBy: USER_A,
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
        googleMeetUrl: 'https://meet.google.com/fake',
        googleCalendarEventId: 'fake-event',
        updatedBy: USER_B,
      }),
    )

    await assertFails(
      strangerDb.doc(`meetings/${MEETING_ID}`).update({
        title: 'Hackeo ajeno',
        updatedBy: USER_C,
      }),
    )

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
  } finally {
    await testEnv.cleanup()
  }
}

main().catch((error) => {
  console.error('Agenda Firestore rules tests: FAIL')
  console.error(error)
  process.exitCode = 1
})
