import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  CreateMeetingInput,
  Meeting,
  MeetingStatus,
  UpdateMeetingInput,
} from '@/features/agenda/types/meeting.types'
import { deriveParticipantUserIds } from '@/features/agenda/utils/meetingAccess'
import { addMinutes } from '@/features/agenda/utils/meetingDateUtils'
import { mapMeetingDocument } from '@/features/agenda/utils/meetingMappers'
import { googleCalendarFunctionsService } from '@/features/agenda/services/google-calendar-functions.service'
import { leadActivitiesService } from '@/services/lead-activities.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

function sortMeetingsByStartAt(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((left, right) => {
    const leftMs = left.startAt?.toMillis?.() ?? 0
    const rightMs = right.startAt?.toMillis?.() ?? 0
    return leftMs - rightMs
  })
}

async function listMeetingsForUser(uid: string): Promise<Meeting[]> {
  const meetingsRef = collection(getFirebaseDb(), COLLECTIONS.meetings)

  const [organizedSnapshot, participatingSnapshot] = await Promise.all([
    getDocs(query(meetingsRef, where('organizerId', '==', uid), orderBy('startAt', 'asc'))),
    getDocs(
      query(
        meetingsRef,
        where('participantUserIds', 'array-contains', uid),
        orderBy('startAt', 'asc'),
      ),
    ),
  ])

  const byId = new Map<string, Meeting>()

  for (const meetingDoc of organizedSnapshot.docs) {
    byId.set(meetingDoc.id, mapMeetingDocument(meetingDoc.id, meetingDoc.data()))
  }

  for (const meetingDoc of participatingSnapshot.docs) {
    if (!byId.has(meetingDoc.id)) {
      byId.set(meetingDoc.id, mapMeetingDocument(meetingDoc.id, meetingDoc.data()))
    }
  }

  return sortMeetingsByStartAt([...byId.values()])
}

/** @deprecated Prefer listMeetingsForUser — kept for callers that only need organized meetings. */
async function listMeetingsByOrganizer(organizerId: string): Promise<Meeting[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), COLLECTIONS.meetings),
      where('organizerId', '==', organizerId),
      orderBy('startAt', 'asc'),
    ),
  )

  return snapshot.docs.map((meetingDoc) => mapMeetingDocument(meetingDoc.id, meetingDoc.data()))
}

async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId))
  if (!snapshot.exists()) {
    return null
  }

  return mapMeetingDocument(snapshot.id, snapshot.data())
}

async function createMeetingActivity(
  organizerId: string,
  contactId: string | null,
  description: string,
): Promise<void> {
  if (!contactId) {
    return
  }

  try {
    await leadActivitiesService.createLeadActivity({
      prospectId: contactId,
      leaderId: organizerId,
      type: 'meeting',
      description,
      createdBy: organizerId,
    })
  } catch {
    // Contact history is complementary; meeting creation should not fail if activity write fails.
  }
}

async function createMeeting(organizerId: string, input: CreateMeetingInput): Promise<Meeting> {
  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const db = getFirebaseDb()
  const meetingsRef = collection(db, COLLECTIONS.meetings)
  const participantUserIds = deriveParticipantUserIds(input.participants)

  let googleCalendarEventId: string | null = null
  let googleCalendarHtmlLink: string | null = null
  let googleMeetUrl: string | null = null
  let meetingUrl = input.meetingUrl
  let videoProvider = input.videoProvider
  let meetingProvider: Meeting['meetingProvider'] =
    videoProvider === 'google_meet' ? 'google_meet' : 'none'

  if (input.meetingMode === 'video' && input.videoProvider === 'google_meet') {
    const googleResult = await googleCalendarFunctionsService.createGoogleCalendarEvent({
      title: input.title,
      description: input.description,
      startAtIso: input.startAt.toISOString(),
      endAtIso: endAt.toISOString(),
      timezone: input.timezone,
      attendeeEmails: input.participants
        .map((participant) => participant.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    })

    googleCalendarEventId = googleResult.googleCalendarEventId
    googleCalendarHtmlLink = googleResult.googleCalendarHtmlLink
    googleMeetUrl = googleResult.googleMeetUrl
    meetingUrl = googleMeetUrl
    videoProvider = googleMeetUrl ? 'google_meet' : 'none'
    meetingProvider = googleMeetUrl ? 'google_meet' : 'none'
  }

  const payload = {
    title: input.title,
    type: input.type,
    description: input.description,
    notes: input.notes,
    resultNotes: '',
    status: 'scheduled' as MeetingStatus,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(endAt),
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
    organizerId,
    organizerName: input.organizerName.trim(),
    contactId: input.contactId,
    groupId: null,
    participants: input.participants,
    participantUserIds,
    meetingMode: input.meetingMode,
    videoProvider,
    meetingUrl,
    location: input.meetingMode === 'in_person' ? input.location : null,
    meetingProvider,
    googleCalendarEventId,
    googleCalendarHtmlLink,
    googleMeetUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: organizerId,
    updatedBy: organizerId,
    completedAt: null,
    cancelledAt: null,
  }

  const docRef = await addDoc(meetingsRef, payload)
  await createMeetingActivity(
    organizerId,
    input.contactId,
    `Reunión agendada: ${input.title}`,
  )

  const created = await getMeetingById(docRef.id)
  if (!created) {
    throw new Error('La reunión se creó, pero no pudimos cargarla.')
  }

  return created
}

async function updateMeeting(
  meetingId: string,
  organizerId: string,
  input: UpdateMeetingInput,
): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  if (existing.organizerId !== organizerId) {
    throw new Error('No puedes editar una reunión que no organizas.')
  }

  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const participantUserIds = deriveParticipantUserIds(input.participants)
  let googleCalendarEventId = existing.googleCalendarEventId
  let googleCalendarHtmlLink = existing.googleCalendarHtmlLink
  let googleMeetUrl = existing.googleMeetUrl
  let meetingUrl: string | null
  let videoProvider = input.videoProvider
  let meetingProvider: Meeting['meetingProvider'] =
    videoProvider === 'google_meet' ? 'google_meet' : 'none'

  const shouldSyncGoogle =
    input.syncGoogle &&
    input.meetingMode === 'video' &&
    input.videoProvider === 'google_meet' &&
    Boolean(existing.googleCalendarEventId)

  if (shouldSyncGoogle && existing.googleCalendarEventId) {
    const googleResult = await googleCalendarFunctionsService.updateGoogleCalendarEvent({
      googleCalendarEventId: existing.googleCalendarEventId,
      title: input.title,
      description: input.description,
      startAtIso: input.startAt.toISOString(),
      endAtIso: endAt.toISOString(),
      timezone: input.timezone,
      attendeeEmails: input.participants
        .map((participant) => participant.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    })

    googleCalendarEventId = googleResult.googleCalendarEventId
    googleCalendarHtmlLink = googleResult.googleCalendarHtmlLink
    googleMeetUrl = googleResult.googleMeetUrl ?? existing.googleMeetUrl
    meetingUrl = googleMeetUrl
    videoProvider = googleMeetUrl ? 'google_meet' : videoProvider
    meetingProvider = googleMeetUrl ? 'google_meet' : meetingProvider
  } else if (input.videoProvider === 'manual') {
    meetingUrl = input.meetingUrl
  } else if (input.meetingMode !== 'video') {
    meetingUrl = null
  } else {
    meetingUrl = input.meetingUrl ?? existing.meetingUrl ?? existing.googleMeetUrl
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
    title: input.title,
    type: input.type,
    description: input.description,
    notes: input.notes,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(endAt),
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
    contactId: input.contactId,
    participants: input.participants,
    participantUserIds,
    meetingMode: input.meetingMode,
    videoProvider,
    meetingUrl,
    location: input.meetingMode === 'in_person' ? input.location : null,
    meetingProvider,
    googleCalendarEventId,
    googleCalendarHtmlLink,
    googleMeetUrl,
    status: existing.status === 'cancelled' ? 'rescheduled' : existing.status,
    updatedAt: serverTimestamp(),
    updatedBy: organizerId,
  })

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se actualizó, pero no pudimos cargarla.')
  }

  return updated
}

async function cancelMeeting(meetingId: string, organizerId: string): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  if (existing.organizerId !== organizerId) {
    throw new Error('No puedes cancelar una reunión que no organizas.')
  }

  if (existing.googleCalendarEventId) {
    await googleCalendarFunctionsService.cancelGoogleCalendarEvent({
      googleCalendarEventId: existing.googleCalendarEventId,
    })
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: organizerId,
  })

  await createMeetingActivity(
    organizerId,
    existing.contactId,
    `Reunión cancelada: ${existing.title}`,
  )

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se canceló, pero no pudimos cargarla.')
  }

  return updated
}

async function completeMeeting(
  meetingId: string,
  organizerId: string,
  resultNotes: string,
  status: Extract<MeetingStatus, 'completed' | 'no_show'>,
): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  if (existing.organizerId !== organizerId) {
    throw new Error('No puedes actualizar una reunión que no organizas.')
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
    status,
    resultNotes: resultNotes.trim(),
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: organizerId,
  })

  await createMeetingActivity(
    organizerId,
    existing.contactId,
    status === 'completed'
      ? `Reunión realizada: ${existing.title}${resultNotes.trim() ? ` · ${resultNotes.trim()}` : ''}`
      : `Reunión sin asistencia: ${existing.title}`,
  )

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se actualizó, pero no pudimos cargarla.')
  }

  return updated
}

export const meetingsService = {
  listMeetingsForUser,
  listMeetingsByOrganizer,
  getMeetingById,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
}
