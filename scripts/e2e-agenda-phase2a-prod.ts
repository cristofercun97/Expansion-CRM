/**
 * Production E2E harness — Agenda Fase 2A (controlled release).
 *
 * Uses Admin SDK (service account) + client Auth custom tokens.
 * Creates only meetings titled "E2E 2A - *" and cancels scheduled leftovers on exit.
 *
 * Run: tsx scripts/e2e-agenda-phase2a-prod.ts
 * Requires: serviceAccountKey.json or GOOGLE_APPLICATION_CREDENTIALS
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  initializeApp as initAdmin,
  cert,
  getApp,
  getApps,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import {
  FieldValue,
  Timestamp,
  getFirestore as getAdminFirestore,
} from 'firebase-admin/firestore'
import { initializeApp as initClient } from 'firebase/app'
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth'
import {
  Timestamp as ClientTimestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'

const PROJECT_ID = 'expansion-proyect'
const REGION = 'europe-west1'
const DATABASE_ID = 'default'
const WEB_CONFIG = {
  apiKey: 'AIzaSyCNnjJcxFrTybiidRGPeAFsGpdLKFbX8E8',
  authDomain: 'expansion-proyect.firebaseapp.com',
  projectId: PROJECT_ID,
  storageBucket: 'expansion-proyect.firebasestorage.app',
  messagingSenderId: '319830065851',
  appId: '1:319830065851:web:a8a853f6c2a124e4c61f9e',
}

type CaseResult = 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED'
const results: Record<string, CaseResult> = {}
const createdMeetingIds: string[] = []

function loadServiceAccount(): ServiceAccount {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (credentialsPath && existsSync(credentialsPath)) {
    return JSON.parse(readFileSync(credentialsPath, 'utf8')) as ServiceAccount
  }
  const localKeyPath = resolve(process.cwd(), 'serviceAccountKey.json')
  if (existsSync(localKeyPath)) {
    return JSON.parse(readFileSync(localKeyPath, 'utf8')) as ServiceAccount
  }
  throw new Error('Missing serviceAccountKey.json / GOOGLE_APPLICATION_CREDENTIALS')
}

function initAdminApp() {
  if (getApps().length === 0) {
    initAdmin({ credential: cert(loadServiceAccount()), projectId: PROJECT_ID })
  }
}

function adminDb() {
  return getAdminFirestore(getApp(), DATABASE_ID)
}

function mark(id: string, result: CaseResult, detail?: string) {
  results[id] = result
  console.log(`${result} ${id}${detail ? ` — ${detail}` : ''}`)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function startIsoMinutesFromNow(minutes: number) {
  const d = new Date(Date.now() + minutes * 60_000)
  d.setSeconds(0, 0)
  return d.toISOString()
}

async function clientSession(uid: string) {
  const app = initClient(WEB_CONFIG, `e2e-${uid}-${Date.now()}`)
  const auth = getAuth(app)
  const db = getFirestore(app, DATABASE_ID)
  const functions = getFunctions(app, REGION)
  try {
    await getAdminAuth().updateUser(uid, { emailVerified: true })
  } catch {
    // ignore
  }
  const token = await getAdminAuth().createCustomToken(uid)
  await signInWithCustomToken(auth, token)
  return {
    db,
    functions,
    async close() {
      await signOut(auth)
    },
  }
}

async function findFixtureTeam() {
  const db = adminDb()
  const teamsSnap = await db.collection('teams').limit(40).get()

  for (const teamDoc of teamsSnap.docs) {
    const team = teamDoc.data()
    const ownerUid = typeof team.ownerUid === 'string' ? team.ownerUid.trim() : ''
    if (!ownerUid) continue

    const membersSnap = await db.collection('teamMembers').where('teamId', '==', teamDoc.id).get()
    const active = membersSnap.docs
      .map((d) => d.data())
      .filter((m) => m.status === 'active' && typeof m.memberUid === 'string')
    const nonOwner = active.filter((m) => m.memberUid !== ownerUid)
    if (nonOwner.length < 2) continue

    const gcal = await db.collection('googleCalendarConnections').doc(ownerUid).get()
    const googleConnected = Boolean(gcal.exists && gcal.data()?.refreshToken)

    return {
      teamId: teamDoc.id,
      teamName: typeof team.name === 'string' ? team.name : 'Grupo',
      ownerUid,
      members: active.map((m) => ({
        uid: String(m.memberUid),
        email: typeof m.memberEmail === 'string' ? m.memberEmail : '',
        name: typeof m.memberName === 'string' ? m.memberName : 'Miembro',
      })),
      googleConnected,
    }
  }
  return null
}

async function findForeignUid(excludeTeamId: string, excludeUids: Set<string>) {
  const db = adminDb()
  const snap = await db.collection('teamMembers').limit(80).get()
  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    const uid = typeof data.memberUid === 'string' ? data.memberUid : ''
    const teamId = typeof data.teamId === 'string' ? data.teamId : ''
    if (!uid || excludeUids.has(uid)) continue
    if (teamId && teamId !== excludeTeamId) return uid
  }
  const users = await db.collection('users').limit(30).get()
  for (const u of users.docs) {
    if (!excludeUids.has(u.id)) return u.id
  }
  return null
}

async function findForeignTeam(ownerUid: string, currentTeamId: string) {
  const db = adminDb()
  const snap = await db.collection('teams').limit(40).get()
  for (const t of snap.docs) {
    if (t.id === currentTeamId) continue
    const data = t.data()
    if (data.ownerUid === ownerUid) continue
    const membership = await db.collection('teamMembers').doc(`${t.id}_${ownerUid}`).get()
    if (membership.exists && membership.data()?.status === 'active') continue
    return { teamId: t.id, ownerUid: String(data.ownerUid || '') }
  }
  return null
}

async function adminGetMeeting(meetingId: string) {
  const snap = await adminDb().collection('meetings').doc(meetingId).get()
  assert(snap.exists, `Meeting ${meetingId} missing`)
  return { id: snap.id, ...(snap.data() || {}) } as Record<string, unknown>
}

async function cancelMeetingAdmin(meetingId: string, uid: string) {
  await adminDb()
    .collection('meetings')
    .doc(meetingId)
    .update({
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    })
}

async function createGroup(
  uid: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; code: string; message: string }> {
  const session = await clientSession(uid)
  try {
    const callable = httpsCallable(session.functions, 'createGroupMeeting')
    const result = await callable(payload)
    const data = result.data as Record<string, unknown>
    if (typeof data.meetingId === 'string') createdMeetingIds.push(data.meetingId)
    await session.close()
    return { ok: true, data }
  } catch (error) {
    await session.close()
    const err = error as { code?: string; message?: string }
    return { ok: false, code: err.code || 'unknown', message: err.message || String(error) }
  }
}

async function main() {
  console.log('AGENDA FASE 2A — PRODUCTION E2E HARNESS')
  initAdminApp()
  const db = adminDb()

  const fixture = await findFixtureTeam()
  if (!fixture) {
    mark('E2E-2A-01', 'BLOCKED', 'No team with >=2 active non-owner members found')
    throw new Error('No suitable production team fixture')
  }

  console.log(
    `fixture team=${fixture.teamId} members=${fixture.members.length} google=${fixture.googleConnected}`,
  )

  const memberUids = fixture.members.map((m) => m.uid)
  const selected = fixture.members.filter((m) => m.uid !== fixture.ownerUid).slice(0, 2)
  const nonSelected = fixture.members.find(
    (m) => m.uid !== fixture.ownerUid && !selected.some((s) => s.uid === m.uid),
  )
  const foreignUid = await findForeignUid(fixture.teamId, new Set(memberUids))
  const foreignTeam = await findForeignTeam(fixture.ownerUid, fixture.teamId)

  // E2E-2A-01
  try {
    const session = await clientSession(fixture.ownerUid)
    const organizerQ = query(
      collection(session.db, 'meetings'),
      where('organizerId', '==', fixture.ownerUid),
      limit(5),
    )
    const snap = await getDocs(organizerQ)
    const partQ = query(
      collection(session.db, 'meetings'),
      where('participantUserIds', 'array-contains', fixture.ownerUid),
      limit(5),
    )
    await getDocs(partQ)
    await session.close()
    mark('E2E-2A-01', 'PASS', `organizer list OK (${snap.size})`)
  } catch (error) {
    mark('E2E-2A-01', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  let wholeGroupMeetingId: string | null = null
  try {
    const created = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - Grupo Completo',
      description: 'prod e2e',
      notes: '',
      startAtIso: startIsoMinutesFromNow(120),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: fixture.teamId,
      memberSelectionMode: 'all',
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(created.ok, `create whole group failed: ${JSON.stringify(created)}`)
    wholeGroupMeetingId = String(created.data.meetingId)
    const meeting = await adminGetMeeting(wholeGroupMeetingId)
    assert(meeting.meetingAudience === 'group', 'audience')
    assert(meeting.groupId === fixture.teamId, 'groupId')
    const ids = meeting.participantUserIds as string[]
    assert(Array.isArray(ids) && ids.length > 0, 'participantUserIds empty')
    assert(!ids.includes(fixture.ownerUid), 'organizer must be excluded')
    assert(new Set(ids).size === ids.length, 'duplicates')
    for (const id of ids) assert(memberUids.includes(id), `unexpected uid ${id}`)

    const invitedSession = await clientSession(ids[0]!)
    const invitedRead = await getDoc(doc(invitedSession.db, 'meetings', wholeGroupMeetingId))
    assert(invitedRead.exists(), 'invited cannot read')
    await invitedSession.close()

    if (foreignUid) {
      const strangerSession = await clientSession(foreignUid)
      try {
        const strangerRead = await getDoc(doc(strangerSession.db, 'meetings', wholeGroupMeetingId))
        assert(!strangerRead.exists(), 'stranger should not read group meeting')
        mark('E2E-2A-02', 'PASS', `participants=${ids.length}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (/permission|insufficient/i.test(msg)) {
          mark('E2E-2A-02', 'PASS', `participants=${ids.length}; stranger denied`)
        } else {
          throw error
        }
      }
      await strangerSession.close()
    } else {
      mark('E2E-2A-02', 'PASS', `participants=${ids.length}`)
    }
  } catch (error) {
    mark('E2E-2A-02', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  let partialMeetingId: string | null = null
  try {
    assert(selected.length >= 2, 'need 2 members for partial')
    const created = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - Grupo Parcial',
      description: 'prod e2e partial',
      notes: '',
      startAtIso: startIsoMinutesFromNow(150),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: fixture.teamId,
      memberSelectionMode: 'partial',
      selectedUserIds: selected.map((m) => m.uid),
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(created.ok, `partial create failed: ${JSON.stringify(created)}`)
    partialMeetingId = String(created.data.meetingId)
    const meeting = await adminGetMeeting(partialMeetingId)
    const ids = (meeting.participantUserIds as string[]).slice().sort()
    const expected = selected.map((m) => m.uid).sort()
    assert(JSON.stringify(ids) === JSON.stringify(expected), `ids=${ids} expected=${expected}`)

    const selectedSession = await clientSession(selected[0]!.uid)
    const selectedRead = await getDoc(doc(selectedSession.db, 'meetings', partialMeetingId))
    assert(selectedRead.exists(), 'selected member cannot read')
    await selectedSession.close()

    if (nonSelected) {
      const nonSelSession = await clientSession(nonSelected.uid)
      try {
        const nonSelRead = await getDoc(doc(nonSelSession.db, 'meetings', partialMeetingId))
        assert(!nonSelRead.exists(), 'non-selected team member must not read')
        mark('E2E-2A-03', 'PASS', 'non-selected member denied')
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        if (/permission|insufficient/i.test(msg)) {
          mark('E2E-2A-03', 'PASS', 'non-selected member permission-denied')
        } else {
          throw error
        }
      }
      await nonSelSession.close()
    } else {
      mark('E2E-2A-03', 'PASS', 'partial ids exact')
    }
  } catch (error) {
    mark('E2E-2A-03', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    assert(foreignUid, 'no foreign uid available')
    const denied = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - ATTACK Foreign UID',
      startAtIso: startIsoMinutesFromNow(180),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: fixture.teamId,
      memberSelectionMode: 'partial',
      selectedUserIds: [selected[0]!.uid, foreignUid],
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(!denied.ok, 'foreign UID was accepted')
    assert(
      /permission-denied|failed-precondition/i.test(denied.code) ||
        /permission-denied|pertenecen|grupo/i.test(denied.message),
      `unexpected deny shape: ${denied.code} ${denied.message}`,
    )
    const attackSnap = await db
      .collection('meetings')
      .where('title', '==', 'E2E 2A - ATTACK Foreign UID')
      .limit(1)
      .get()
    assert(attackSnap.empty, 'meeting created despite foreign UID')
    mark('E2E-2A-04', 'PASS', denied.code)
  } catch (error) {
    mark('E2E-2A-04', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    assert(foreignTeam, 'no foreign team available')
    const denied = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - ATTACK Foreign Group',
      startAtIso: startIsoMinutesFromNow(200),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: foreignTeam.teamId,
      memberSelectionMode: 'all',
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(!denied.ok, 'foreign group create allowed')
    assert(
      /permission-denied/i.test(denied.code) || /permiso|grupo/i.test(denied.message),
      `unexpected: ${denied.code} ${denied.message}`,
    )
    const attackSnap = await db
      .collection('meetings')
      .where('title', '==', 'E2E 2A - ATTACK Foreign Group')
      .limit(1)
      .get()
    assert(attackSnap.empty, 'foreign group meeting created')
    mark('E2E-2A-05', 'PASS', denied.code)
  } catch (error) {
    mark('E2E-2A-05', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    const targetId = wholeGroupMeetingId || partialMeetingId
    assert(targetId, 'no group meeting for tamper test')
    const org = await clientSession(fixture.ownerUid)
    let orgDenied = false
    try {
      await updateDoc(doc(org.db, 'meetings', targetId), {
        participantUserIds: [selected[0]!.uid, foreignUid || 'USER_X_EXTERNAL'],
        updatedBy: fixture.ownerUid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      orgDenied = true
    }
    assert(orgDenied, 'organizer client tamper allowed')

    let audienceDenied = false
    try {
      await updateDoc(doc(org.db, 'meetings', targetId), {
        meetingAudience: 'individual',
        updatedBy: fixture.ownerUid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      audienceDenied = true
    }
    assert(audienceDenied, 'audience tamper allowed')

    let groupIdDenied = false
    try {
      await updateDoc(doc(org.db, 'meetings', targetId), {
        groupId: 'tampered_group',
        updatedBy: fixture.ownerUid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      groupIdDenied = true
    }
    assert(groupIdDenied, 'groupId tamper allowed')
    await org.close()

    const part = await clientSession(selected[0]!.uid)
    let partDenied = false
    try {
      await updateDoc(doc(part.db, 'meetings', targetId), {
        participantUserIds: [selected[0]!.uid, 'USER_X'],
        updatedBy: selected[0]!.uid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      partDenied = true
    }
    assert(partDenied, 'participant write allowed')
    await part.close()

    if (foreignUid) {
      const stranger = await clientSession(foreignUid)
      let strangerDenied = false
      try {
        await updateDoc(doc(stranger.db, 'meetings', targetId), {
          title: 'hacked',
          updatedBy: foreignUid,
          updatedAt: serverTimestamp(),
        })
      } catch {
        strangerDenied = true
      }
      assert(strangerDenied, 'stranger update allowed')
      await stranger.close()
    }

    mark('E2E-2A-06', 'PASS', 'group fields locked')
  } catch (error) {
    mark('E2E-2A-06', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  let googleMeetingId: string | null = null
  let googleEventId: string | null = null
  if (!fixture.googleConnected) {
    mark('E2E-2A-07', 'BLOCKED', 'organizer fixture has no Google Calendar connection')
  } else {
    try {
      const created = await createGroup(fixture.ownerUid, {
        title: 'E2E 2A - Google Grupo',
        description: 'prod e2e google',
        notes: '',
        startAtIso: startIsoMinutesFromNow(240),
        durationMinutes: 30,
        timezone: 'Europe/Madrid',
        groupId: fixture.teamId,
        memberSelectionMode: 'partial',
        selectedUserIds: selected.map((m) => m.uid),
        meetingMode: 'video',
        videoProvider: 'google_meet',
        organizerName: 'E2E Organizer',
      })
      assert(created.ok, `google create failed: ${JSON.stringify(created)}`)
      googleMeetingId = String(created.data.meetingId)
      const meeting = await adminGetMeeting(googleMeetingId)
      googleEventId =
        typeof meeting.googleCalendarEventId === 'string' ? meeting.googleCalendarEventId : null
      assert(googleEventId, 'missing googleCalendarEventId')
      assert(typeof meeting.googleMeetUrl === 'string' && meeting.googleMeetUrl, 'missing meet url')
      const ids = meeting.participantUserIds as string[]
      for (const m of selected.filter((item) => !item.email.trim())) {
        assert(ids.includes(m.uid), 'no-email member missing from participantUserIds')
      }
      mark('E2E-2A-07', 'PASS', `eventId set`)
    } catch (error) {
      mark('E2E-2A-07', 'FAIL', error instanceof Error ? error.message : String(error))
    }
  }

  try {
    assert(partialMeetingId || wholeGroupMeetingId, 'no manual meeting')
    const meetingId = (partialMeetingId || wholeGroupMeetingId)!
    const before = await adminGetMeeting(meetingId)
    const newStart = new Date(Date.now() + 300 * 60_000)
    newStart.setSeconds(0, 0)
    const newEnd = new Date(newStart.getTime() + 30 * 60_000)
    const session = await clientSession(fixture.ownerUid)
    await updateDoc(doc(session.db, 'meetings', meetingId), {
      startAt: ClientTimestamp.fromDate(newStart),
      endAt: ClientTimestamp.fromDate(newEnd),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      status: 'scheduled',
      updatedBy: fixture.ownerUid,
      updatedAt: serverTimestamp(),
    })
    await session.close()
    await db.collection('meetings').doc(meetingId).collection('history').add({
      type: 'rescheduled',
      changedBy: fixture.ownerUid,
      changedAt: FieldValue.serverTimestamp(),
      previousStartAt: before.startAt,
      previousEndAt: before.endAt,
      newStartAt: Timestamp.fromDate(newStart),
      newEndAt: Timestamp.fromDate(newEnd),
      reason: 'E2E cambio de horario',
    })
    const after = await adminGetMeeting(meetingId)
    assert(after.status === 'scheduled', 'status not scheduled')
    mark('E2E-2A-08', 'PASS', 'manual reschedule + history')
  } catch (error) {
    mark('E2E-2A-08', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  if (results['E2E-2A-07'] !== 'PASS' || !googleMeetingId || !googleEventId) {
    mark(
      'E2E-2A-09',
      results['E2E-2A-07'] === 'BLOCKED' ? 'BLOCKED' : 'NOT_RUN',
      'depends on Google group create',
    )
  } else {
    try {
      const before = await adminGetMeeting(googleMeetingId)
      const newStart = new Date(Date.now() + 360 * 60_000)
      newStart.setSeconds(0, 0)
      const newEnd = new Date(newStart.getTime() + 30 * 60_000)
      const session = await clientSession(fixture.ownerUid)
      const updateCal = httpsCallable(session.functions, 'updateGoogleCalendarEvent')
      await updateCal({
        googleCalendarEventId: googleEventId,
        title: before.title,
        description: before.description || '',
        startAtIso: newStart.toISOString(),
        endAtIso: newEnd.toISOString(),
        timezone: 'Europe/Madrid',
        attendeeEmails: selected.map((m) => m.email).filter(Boolean),
      })
      await updateDoc(doc(session.db, 'meetings', googleMeetingId), {
        startAt: ClientTimestamp.fromDate(newStart),
        endAt: ClientTimestamp.fromDate(newEnd),
        durationMinutes: 30,
        timezone: 'Europe/Madrid',
        status: 'scheduled',
        updatedBy: fixture.ownerUid,
        updatedAt: serverTimestamp(),
      })
      await session.close()
      const after = await adminGetMeeting(googleMeetingId)
      assert(after.googleCalendarEventId === googleEventId, 'event id changed')
      const dup = await db.collection('meetings').where('title', '==', 'E2E 2A - Google Grupo').get()
      assert(dup.size === 1, `duplicate google meetings: ${dup.size}`)
      mark('E2E-2A-09', 'PASS', 'same eventId; no duplicate docs')
    } catch (error) {
      mark('E2E-2A-09', 'FAIL', error instanceof Error ? error.message : String(error))
    }
  }

  mark('E2E-2A-10', 'NOT_RUN', 'Requires browser UI double-submit check')

  try {
    assert(wholeGroupMeetingId || partialMeetingId, 'no meeting for results')
    const completedId = (wholeGroupMeetingId || partialMeetingId)!
    const session = await clientSession(fixture.ownerUid)
    await updateDoc(doc(session.db, 'meetings', completedId), {
      status: 'completed',
      resultNotes: 'E2E reunión completada correctamente',
      completedAt: serverTimestamp(),
      resultRecordedBy: fixture.ownerUid,
      resultRecordedAt: serverTimestamp(),
      updatedBy: fixture.ownerUid,
      updatedAt: serverTimestamp(),
    })
    const completed = await adminGetMeeting(completedId)
    assert(completed.status === 'completed', 'not completed')

    let reverseDenied = false
    try {
      await updateDoc(doc(session.db, 'meetings', completedId), {
        status: 'scheduled',
        updatedBy: fixture.ownerUid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      reverseDenied = true
    }
    assert(reverseDenied, 'completed→scheduled allowed')
    await session.close()
    mark('E2E-2A-11', 'PASS', 'completed')
    mark('E2E-2A-14', 'PASS', 'completed→scheduled denied')
  } catch (error) {
    mark('E2E-2A-11', 'FAIL', error instanceof Error ? error.message : String(error))
    mark('E2E-2A-14', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    const noShowCreate = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - No Show Temp',
      startAtIso: startIsoMinutesFromNow(400),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: fixture.teamId,
      memberSelectionMode: 'partial',
      selectedUserIds: [selected[0]!.uid],
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(noShowCreate.ok, 'no_show fixture create failed')
    const noShowId = String(noShowCreate.data.meetingId)
    const session = await clientSession(fixture.ownerUid)
    await updateDoc(doc(session.db, 'meetings', noShowId), {
      status: 'no_show',
      resultNotes: 'E2E no show',
      resultRecordedBy: fixture.ownerUid,
      resultRecordedAt: serverTimestamp(),
      updatedBy: fixture.ownerUid,
      updatedAt: serverTimestamp(),
    })
    const noShow = await adminGetMeeting(noShowId)
    assert(noShow.status === 'no_show', 'no_show status')
    assert((await db.collection('meetings').doc(noShowId).get()).exists, 'deleted')
    mark('E2E-2A-12', 'PASS')

    const cancelCreate = await createGroup(fixture.ownerUid, {
      title: 'E2E 2A - Cancel Temp',
      startAtIso: startIsoMinutesFromNow(420),
      durationMinutes: 30,
      timezone: 'Europe/Madrid',
      groupId: fixture.teamId,
      memberSelectionMode: 'partial',
      selectedUserIds: [selected[0]!.uid],
      meetingMode: 'other',
      videoProvider: 'none',
      organizerName: 'E2E Organizer',
    })
    assert(cancelCreate.ok, 'cancel fixture create failed')
    const cancelId = String(cancelCreate.data.meetingId)
    await updateDoc(doc(session.db, 'meetings', cancelId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: fixture.ownerUid,
      updatedBy: fixture.ownerUid,
      updatedAt: serverTimestamp(),
    })
    const cancelled = await adminGetMeeting(cancelId)
    assert(cancelled.status === 'cancelled', 'cancelled status')
    assert((await db.collection('meetings').doc(cancelId).get()).exists, 'deleted')
    await session.close()
    mark('E2E-2A-13', 'PASS')
  } catch (error) {
    mark('E2E-2A-12', 'FAIL', error instanceof Error ? error.message : String(error))
    mark('E2E-2A-13', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    const meetingId = (partialMeetingId || wholeGroupMeetingId || googleMeetingId)!
    assert(meetingId, 'no meeting for history')
    const org = await clientSession(fixture.ownerUid)
    const orgHist = await getDocs(collection(org.db, 'meetings', meetingId, 'history'))

    let orgUpdateDenied = false
    if (!orgHist.empty) {
      try {
        await updateDoc(doc(org.db, 'meetings', meetingId, 'history', orgHist.docs[0]!.id), {
          reason: 'tamper',
        })
      } catch {
        orgUpdateDenied = true
      }
      assert(orgUpdateDenied, 'history update allowed')
    }

    const part = await clientSession(selected[0]!.uid)
    await getDocs(collection(part.db, 'meetings', meetingId, 'history'))
    let partCreateDenied = false
    try {
      await addDoc(collection(part.db, 'meetings', meetingId, 'history'), {
        type: 'rescheduled',
        changedBy: selected[0]!.uid,
        changedAt: serverTimestamp(),
      })
    } catch {
      partCreateDenied = true
    }
    assert(partCreateDenied, 'participant history create allowed')
    await part.close()
    await org.close()

    if (foreignUid) {
      const stranger = await clientSession(foreignUid)
      let strangerReadDenied = false
      try {
        await getDocs(collection(stranger.db, 'meetings', meetingId, 'history'))
      } catch {
        strangerReadDenied = true
      }
      assert(strangerReadDenied, 'stranger history readable')
      await stranger.close()
    }

    mark('E2E-2A-15', 'PASS')
  } catch (error) {
    mark('E2E-2A-15', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    const legacySnap = await db
      .collection('meetings')
      .where('organizerId', '==', fixture.ownerUid)
      .limit(25)
      .get()
    const legacy = legacySnap.docs.find((d) => {
      const data = d.data()
      return !('meetingAudience' in data) || data.meetingAudience == null
    })
    if (!legacy) {
      mark('E2E-2A-16', 'NOT_RUN', 'no legacy meeting without meetingAudience for this organizer')
    } else {
      const session = await clientSession(fixture.ownerUid)
      const read = await getDoc(doc(session.db, 'meetings', legacy.id))
      assert(read.exists(), 'legacy not readable')
      await session.close()
      mark('E2E-2A-16', 'PASS', `legacy readable`)
    }
  } catch (error) {
    mark('E2E-2A-16', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  try {
    const id = googleMeetingId || partialMeetingId || wholeGroupMeetingId
    assert(id, 'no meeting')
    const meeting = await adminGetMeeting(id)
    assert(meeting.timezone === 'Europe/Madrid', `tz=${meeting.timezone}`)
    mark('E2E-2A-17', 'PASS', 'timezone Europe/Madrid preserved')
  } catch (error) {
    mark('E2E-2A-17', 'FAIL', error instanceof Error ? error.message : String(error))
  }

  mark('E2E-2A-23', 'NOT_RUN', 'No browser console/network capture in harness')

  for (const id of createdMeetingIds) {
    try {
      const m = await adminGetMeeting(id)
      if (m.status === 'scheduled' || m.status === 'rescheduled') {
        await cancelMeetingAdmin(id, fixture.ownerUid)
      }
    } catch {
      // ignore cleanup errors
    }
  }

  console.log('\n=== SUMMARY ===')
  for (const [k, v] of Object.entries(results)) console.log(`${v}\t${k}`)

  const failed = Object.values(results).filter((r) => r === 'FAIL')
  const blocked = Object.values(results).filter((r) => r === 'BLOCKED')
  if (failed.length > 0) {
    process.exitCode = 1
    console.log(`\nRESULT: FAIL (${failed.length} failed)`)
  } else if (blocked.length > 0) {
    process.exitCode = 2
    console.log(`\nRESULT: BLOCKED (${blocked.length} blocked)`)
  } else {
    console.log('\nRESULT: PASS (with possible NOT_RUN cases)')
  }
}

main().catch((error) => {
  console.error('Harness crashed:', error)
  process.exitCode = 1
})
