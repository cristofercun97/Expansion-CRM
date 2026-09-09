import { FirebaseError } from 'firebase/app'
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
  type QuerySnapshot,
} from 'firebase/firestore'
import type {
  CreateMeetingInput,
  Meeting,
  MeetingHistoryEvent,
  MeetingHistoryType,
  MeetingStatus,
  RecordMeetingResultInput,
  RescheduleMeetingInput,
  UpdateMeetingInput,
} from '@/features/agenda/types/meeting.types'
import {
  assertCanTransitionMeetingStatus,
  deriveParticipantUserIds,
} from '@/features/agenda/utils/meetingAccess'
import { addMinutes } from '@/features/agenda/utils/meetingDateUtils'
import { mapMeetingDocument } from '@/features/agenda/utils/meetingMappers'
import { googleCalendarFunctionsService } from '@/features/agenda/services/google-calendar-functions.service'
import { groupMeetingFunctionsService } from '@/features/agenda/services/group-meeting-functions.service'
import { leadActivitiesService } from '@/services/lead-activities.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

type AgendaListQueryType = 'organizer' | 'participant'

export class AgendaMeetingsQueryError extends Error {
  readonly code: string
  readonly queryType: AgendaListQueryType
  readonly collectionName = COLLECTIONS.meetings

  constructor(queryType: AgendaListQueryType, cause: unknown) {
    const firebaseError = cause instanceof FirebaseError ? cause : null
    const code = firebaseError?.code ?? 'unknown'
    super(
      firebaseError?.message ??
        (cause instanceof Error ? cause.message : 'No pudimos cargar tus reuniones.'),
    )
    this.name = 'AgendaMeetingsQueryError'
    this.code = code
    this.queryType = queryType
  }
}

function sortMeetingsByStartAt(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((left, right) => {
    const leftMs = left.startAt?.toMillis?.() ?? 0
    const rightMs = right.startAt?.toMillis?.() ?? 0
    return leftMs - rightMs
  })
}

function collectAttendeeEmails(
  participants: CreateMeetingInput['participants'] | UpdateMeetingInput['participants'],
): string[] {
  const emails = new Set<string>()
  for (const participant of participants) {
    const email = participant.email?.trim().toLowerCase()
    if (email) {
      emails.add(email)
    }
  }
  return [...emails]
}

function meetingHistoryCollection(meetingId: string) {
  return collection(getFirebaseDb(), COLLECTIONS.meetings, meetingId, 'history')
}

async function appendMeetingHistory(options: {
  meetingId: string
  type: MeetingHistoryType
  changedBy: string
  previousStartAt?: Date | null
  previousEndAt?: Date | null
  newStartAt?: Date | null
  newEndAt?: Date | null
  reason?: string | null
  resultNotes?: string | null
}): Promise<void> {
  const payload: Record<string, unknown> = {
    type: options.type,
    changedBy: options.changedBy,
    changedAt: serverTimestamp(),
  }

  if (options.previousStartAt) {
    payload.previousStartAt = Timestamp.fromDate(options.previousStartAt)
  }
  if (options.previousEndAt) {
    payload.previousEndAt = Timestamp.fromDate(options.previousEndAt)
  }
  if (options.newStartAt) {
    payload.newStartAt = Timestamp.fromDate(options.newStartAt)
  }
  if (options.newEndAt) {
    payload.newEndAt = Timestamp.fromDate(options.newEndAt)
  }
  if (options.reason?.trim()) {
    payload.reason = options.reason.trim()
  }
  if (options.resultNotes?.trim()) {
    payload.resultNotes = options.resultNotes.trim()
  }

  await addDoc(meetingHistoryCollection(options.meetingId), payload)
}

async function runMeetingsListQuery(
  queryType: AgendaListQueryType,
  run: () => Promise<QuerySnapshot>,
): Promise<QuerySnapshot> {
  try {
    return await run()
  } catch (error) {
    if (import.meta.env.DEV) {
      const code = error instanceof FirebaseError ? error.code : 'unknown'
      console.info('[Agenda query]', { queryType, code, collection: COLLECTIONS.meetings })
    }
    throw new AgendaMeetingsQueryError(queryType, error)
  }
}

async function listMeetingsForUser(uid: string): Promise<Meeting[]> {
  const meetingsRef = collection(getFirebaseDb(), COLLECTIONS.meetings)

  const organizedSnapshot = await runMeetingsListQuery('organizer', () =>
    getDocs(query(meetingsRef, where('organizerId', '==', uid), orderBy('startAt', 'asc'))),
  )
  const participatingSnapshot = await runMeetingsListQuery('participant', () =>
    getDocs(
      query(
        meetingsRef,
        where('participantUserIds', 'array-contains', uid),
        orderBy('startAt', 'asc'),
      ),
    ),
  )

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

async function listMeetingHistory(meetingId: string): Promise<MeetingHistoryEvent[]> {
  const snapshot = await getDocs(
    query(meetingHistoryCollection(meetingId), orderBy('changedAt', 'desc')),
  )

  return snapshot.docs.map((historyDoc) => {
    const data = historyDoc.data()
    return {
      id: historyDoc.id,
      type: data.type as MeetingHistoryType,
      changedBy: typeof data.changedBy === 'string' ? data.changedBy : '',
      changedAt: data.changedAt instanceof Timestamp ? data.changedAt : null,
      previousStartAt: data.previousStartAt instanceof Timestamp ? data.previousStartAt : null,
      previousEndAt: data.previousEndAt instanceof Timestamp ? data.previousEndAt : null,
      newStartAt: data.newStartAt instanceof Timestamp ? data.newStartAt : null,
      newEndAt: data.newEndAt instanceof Timestamp ? data.newEndAt : null,
      reason: typeof data.reason === 'string' ? data.reason : null,
      resultNotes: typeof data.resultNotes === 'string' ? data.resultNotes : null,
    }
  })
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

function assertOrganizer(existing: Meeting, organizerId: string, action: string): void {
  if (existing.organizerId !== organizerId) {
    throw new Error(`No puedes ${action} una reunión que no organizas.`)
  }
}

function collectSelectedUserIds(
  participants: CreateMeetingInput['participants'],
  organizerId: string,
): string[] {
  return deriveParticipantUserIds(participants, organizerId)
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}

async function createMeeting(organizerId: string, input: CreateMeetingInput): Promise<Meeting> {
  if (input.meetingAudience === 'group') {
    return createGroupMeetingViaBackend(organizerId, input)
  }

  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const db = getFirebaseDb()
  const meetingsRef = collection(db, COLLECTIONS.meetings)
  const participantUserIds = deriveParticipantUserIds(input.participants, organizerId)

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
      attendeeEmails: collectAttendeeEmails(input.participants),
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
    meetingAudience: input.meetingAudience,
    groupId: null,
    groupNameSnapshot: null,
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
    cancelledBy: null,
    cancelReason: null,
    resultRecordedBy: null,
    resultRecordedAt: null,
  }

  const docRef = await addDoc(meetingsRef, payload)

  try {
    await appendMeetingHistory({
      meetingId: docRef.id,
      type: 'created',
      changedBy: organizerId,
      newStartAt: input.startAt,
      newEndAt: endAt,
    })
  } catch {
    // History is complementary; meeting already created.
  }

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

async function createGroupMeetingViaBackend(
  organizerId: string,
  input: CreateMeetingInput,
): Promise<Meeting> {
  const groupId = input.groupId?.trim()
  if (!groupId) {
    throw new Error('Selecciona un grupo para la reunión grupal.')
  }

  const memberSelectionMode = input.groupMemberSelectionMode === 'partial' ? 'partial' : 'all'
  const selectedUserIds =
    memberSelectionMode === 'partial'
      ? collectSelectedUserIds(input.participants, organizerId)
      : undefined

  if (memberSelectionMode === 'partial' && (!selectedUserIds || selectedUserIds.length === 0)) {
    throw new Error('El grupo no tiene miembros disponibles o la selección está vacía.')
  }

  const result = await groupMeetingFunctionsService.createGroupMeeting({
    title: input.title,
    type: input.type,
    description: input.description,
    notes: input.notes,
    startAtIso: input.startAt.toISOString(),
    durationMinutes: input.durationMinutes,
    timezone: input.timezone,
    groupId,
    memberSelectionMode,
    selectedUserIds,
    meetingMode: input.meetingMode,
    videoProvider: input.videoProvider,
    meetingUrl: input.meetingUrl,
    location: input.location,
    organizerName: input.organizerName.trim(),
  })

  await createMeetingActivity(
    organizerId,
    null,
    `Reunión agendada: ${input.title}`,
  )

  const created = await getMeetingById(result.meetingId)
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

  assertOrganizer(existing, organizerId, 'editar')
  assertCanTransitionMeetingStatus(existing.status, existing.status)

  if (existing.status !== 'scheduled' && existing.status !== 'rescheduled') {
    throw new Error('Solo puedes editar reuniones programadas.')
  }

  if (existing.meetingAudience === 'group' || input.meetingAudience === 'group') {
    return updateGroupMeetingViaBackend(meetingId, organizerId, existing, input)
  }

  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const participantUserIds = deriveParticipantUserIds(input.participants, organizerId)
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
    try {
      const googleResult = await googleCalendarFunctionsService.updateGoogleCalendarEvent({
        googleCalendarEventId: existing.googleCalendarEventId,
        title: input.title,
        description: input.description,
        startAtIso: input.startAt.toISOString(),
        endAtIso: endAt.toISOString(),
        timezone: input.timezone,
        attendeeEmails: collectAttendeeEmails(input.participants),
      })

      googleCalendarEventId = googleResult.googleCalendarEventId
      googleCalendarHtmlLink = googleResult.googleCalendarHtmlLink
      googleMeetUrl = googleResult.googleMeetUrl ?? existing.googleMeetUrl
      meetingUrl = googleMeetUrl
      videoProvider = googleMeetUrl ? 'google_meet' : videoProvider
      meetingProvider = googleMeetUrl ? 'google_meet' : meetingProvider
    } catch {
      throw new Error('No se pudo actualizar la reunión en Google Calendar.')
    }
  } else if (input.videoProvider === 'manual') {
    meetingUrl = input.meetingUrl
  } else if (input.meetingMode !== 'video') {
    meetingUrl = null
  } else {
    meetingUrl = input.meetingUrl ?? existing.meetingUrl ?? existing.googleMeetUrl
  }

  try {
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
      meetingAudience: 'individual',
      groupId: null,
      groupNameSnapshot: null,
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
      status: 'scheduled',
      updatedAt: serverTimestamp(),
      updatedBy: organizerId,
    })
  } catch (error) {
    if (shouldSyncGoogle) {
      throw new Error(
        'La reunión se actualizó en Google pero no pudo sincronizarse con EXPANSIÓN.',
        { cause: error },
      )
    }
    throw error
  }

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se actualizó, pero no pudimos cargarla.')
  }

  return updated
}

async function updateGroupMeetingViaBackend(
  meetingId: string,
  organizerId: string,
  existing: Meeting,
  input: UpdateMeetingInput,
): Promise<Meeting> {
  if (existing.meetingAudience !== 'group' || !existing.groupId) {
    throw new Error('No se puede convertir una reunión individual en grupal desde el cliente.')
  }

  if (input.meetingAudience !== 'group') {
    throw new Error('No se puede cambiar el tipo de audiencia de una reunión grupal.')
  }

  if (input.groupId && input.groupId !== existing.groupId) {
    throw new Error('No se puede cambiar el grupo de una reunión existente.')
  }

  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const memberSelectionMode = input.groupMemberSelectionMode === 'partial' ? 'partial' : 'all'
  const selectedUserIds =
    memberSelectionMode === 'partial'
      ? collectSelectedUserIds(input.participants, organizerId)
      : undefined

  const nextParticipantIds =
    memberSelectionMode === 'partial'
      ? selectedUserIds || []
      : collectSelectedUserIds(input.participants, organizerId)
  const participantsChanged = !sameStringSet(existing.participantUserIds, nextParticipantIds)

  const shouldSyncGoogle =
    input.syncGoogle &&
    input.meetingMode === 'video' &&
    input.videoProvider === 'google_meet' &&
    Boolean(existing.googleCalendarEventId)

  // Always re-authorize membership server-side when editing a group meeting.
  await groupMeetingFunctionsService.updateGroupMeetingParticipants({
    meetingId,
    memberSelectionMode,
    selectedUserIds,
    syncGoogleAttendees: shouldSyncGoogle,
    title: input.title,
    description: input.description,
    startAtIso: input.startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    timezone: input.timezone,
  })

  let meetingUrl: string | null
  let videoProvider = input.videoProvider
  let meetingProvider: Meeting['meetingProvider'] =
    videoProvider === 'google_meet' ? 'google_meet' : 'none'

  if (input.videoProvider === 'manual') {
    meetingUrl = input.meetingUrl
  } else if (input.meetingMode !== 'video') {
    meetingUrl = null
  } else {
    meetingUrl = input.meetingUrl ?? existing.meetingUrl ?? existing.googleMeetUrl
  }

  if (shouldSyncGoogle) {
    meetingUrl = existing.googleMeetUrl ?? meetingUrl
    videoProvider = meetingUrl ? 'google_meet' : videoProvider
    meetingProvider = meetingUrl ? 'google_meet' : meetingProvider
  }

  try {
    // Do not write groupId / meetingAudience / participantUserIds / participants from client.
    await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
      title: input.title,
      type: input.type,
      description: input.description,
      notes: input.notes,
      startAt: Timestamp.fromDate(input.startAt),
      endAt: Timestamp.fromDate(endAt),
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      contactId: null,
      meetingMode: input.meetingMode,
      videoProvider,
      meetingUrl,
      location: input.meetingMode === 'in_person' ? input.location : null,
      meetingProvider,
      status: 'scheduled',
      updatedAt: serverTimestamp(),
      updatedBy: organizerId,
    })
  } catch (error) {
    if (shouldSyncGoogle || participantsChanged) {
      throw new Error(
        'Los participantes se actualizaron, pero no pudimos guardar el resto de cambios.',
        { cause: error },
      )
    }
    throw error
  }

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se actualizó, pero no pudimos cargarla.')
  }

  return updated
}

async function rescheduleMeeting(
  meetingId: string,
  organizerId: string,
  input: RescheduleMeetingInput,
): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  assertOrganizer(existing, organizerId, 'reprogramar')
  assertCanTransitionMeetingStatus(existing.status, 'scheduled')

  if (existing.status !== 'scheduled' && existing.status !== 'rescheduled') {
    throw new Error('Solo puedes reprogramar reuniones programadas.')
  }

  const endAt = addMinutes(input.startAt, input.durationMinutes)
  const previousStartAt = existing.startAt?.toDate?.() ?? null
  const previousEndAt = existing.endAt?.toDate?.() ?? null

  if (existing.googleCalendarEventId) {
    try {
      await googleCalendarFunctionsService.updateGoogleCalendarEvent({
        googleCalendarEventId: existing.googleCalendarEventId,
        title: existing.title,
        description: existing.description,
        startAtIso: input.startAt.toISOString(),
        endAtIso: endAt.toISOString(),
        timezone: input.timezone,
        attendeeEmails: collectAttendeeEmails(existing.participants),
      })
    } catch {
      throw new Error('No se pudo actualizar la reunión en Google Calendar.')
    }
  }

  try {
    await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
      startAt: Timestamp.fromDate(input.startAt),
      endAt: Timestamp.fromDate(endAt),
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      status: 'scheduled',
      updatedAt: serverTimestamp(),
      updatedBy: organizerId,
    })
  } catch (error) {
    if (existing.googleCalendarEventId) {
      throw new Error(
        'La reunión se actualizó en Google pero no pudo sincronizarse con EXPANSIÓN.',
        { cause: error },
      )
    }
    throw error
  }

  await appendMeetingHistory({
    meetingId,
    type: 'rescheduled',
    changedBy: organizerId,
    previousStartAt,
    previousEndAt,
    newStartAt: input.startAt,
    newEndAt: endAt,
    reason: input.reason?.trim() || null,
  })

  const updated = await getMeetingById(meetingId)
  if (!updated) {
    throw new Error('La reunión se reprogramó, pero no pudimos cargarla.')
  }

  return updated
}

async function cancelMeeting(
  meetingId: string,
  organizerId: string,
  cancelReason?: string,
): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  assertOrganizer(existing, organizerId, 'cancelar')
  assertCanTransitionMeetingStatus(existing.status, 'cancelled')

  if (existing.googleCalendarEventId) {
    try {
      await googleCalendarFunctionsService.cancelGoogleCalendarEvent({
        googleCalendarEventId: existing.googleCalendarEventId,
      })
    } catch {
      throw new Error('No se pudo cancelar la reunión en Google Calendar.')
    }
  }

  try {
    await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: organizerId,
      cancelReason: cancelReason?.trim() || null,
      updatedAt: serverTimestamp(),
      updatedBy: organizerId,
    })
  } catch (error) {
    if (existing.googleCalendarEventId) {
      throw new Error(
        'La reunión se actualizó en Google pero no pudo sincronizarse con EXPANSIÓN.',
        { cause: error },
      )
    }
    throw error
  }

  await appendMeetingHistory({
    meetingId,
    type: 'cancelled',
    changedBy: organizerId,
    reason: cancelReason?.trim() || null,
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
  return recordMeetingResult(meetingId, organizerId, {
    outcome: status,
    resultNotes,
  })
}

async function recordMeetingResult(
  meetingId: string,
  organizerId: string,
  input: RecordMeetingResultInput,
): Promise<Meeting> {
  const existing = await getMeetingById(meetingId)
  if (!existing) {
    throw new Error('No encontramos la reunión.')
  }

  assertOrganizer(existing, organizerId, 'registrar el resultado de')

  if (input.outcome === 'cancelled') {
    return cancelMeeting(meetingId, organizerId, input.cancelReason ?? input.resultNotes)
  }

  assertCanTransitionMeetingStatus(existing.status, input.outcome)

  const notes = input.resultNotes?.trim() ?? ''
  if (input.outcome === 'completed' && notes.length < 3) {
    throw new Error('Añade un resumen del resultado (mínimo 3 caracteres).')
  }

  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.meetings, meetingId), {
    status: input.outcome,
    resultNotes: notes,
    completedAt: serverTimestamp(),
    resultRecordedBy: organizerId,
    resultRecordedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: organizerId,
  })

  await appendMeetingHistory({
    meetingId,
    type: input.outcome,
    changedBy: organizerId,
    resultNotes: notes || null,
  })

  await createMeetingActivity(
    organizerId,
    existing.contactId,
    input.outcome === 'completed'
      ? `Reunión realizada: ${existing.title}${notes ? ` · ${notes}` : ''}`
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
  listMeetingHistory,
  createMeeting,
  updateMeeting,
  rescheduleMeeting,
  cancelMeeting,
  completeMeeting,
  recordMeetingResult,
}

export type { AgendaListQueryType }
