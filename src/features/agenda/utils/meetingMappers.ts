import {
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import type {
  Meeting,
  MeetingAudience,
  MeetingParticipant,
  MeetingStatus,
  MeetingType,
} from '@/features/agenda/types/meeting.types'
import { resolveMeetingModeFields } from '@/features/agenda/utils/meetingModeUtils'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function mapParticipant(value: unknown): MeetingParticipant | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const data = value as Record<string, unknown>
  const type = data.type

  if (type !== 'user' && type !== 'contact' && type !== 'external') {
    return null
  }

  const name = asString(data.name).trim()
  if (!name) {
    return null
  }

  return {
    type,
    userId: asString(data.userId) || undefined,
    contactId: asString(data.contactId) || undefined,
    name,
    email: asString(data.email) || undefined,
  }
}

function mapStatus(value: unknown): MeetingStatus {
  if (
    value === 'scheduled' ||
    value === 'completed' ||
    value === 'cancelled' ||
    value === 'no_show' ||
    value === 'rescheduled'
  ) {
    return value
  }

  return 'scheduled'
}

function mapType(value: unknown): MeetingType {
  if (
    value === 'individual' ||
    value === 'group' ||
    value === 'follow_up' ||
    value === 'presentation' ||
    value === 'training' ||
    value === 'evaluation' ||
    value === 'other'
  ) {
    return value
  }

  return 'other'
}

function mapAudience(value: unknown, groupId: string | null): MeetingAudience {
  if (value === 'group' || value === 'individual') {
    return value
  }

  return groupId ? 'group' : 'individual'
}

export function mapMeetingDocument(id: string, data: DocumentData): Meeting {
  const participants = Array.isArray(data.participants)
    ? data.participants
        .map((item) => mapParticipant(item))
        .filter((item): item is MeetingParticipant => Boolean(item))
    : []

  const modeFields = resolveMeetingModeFields({
    meetingMode: data.meetingMode,
    videoProvider: data.videoProvider,
    meetingUrl: data.meetingUrl,
    location: data.location,
    meetingProvider: data.meetingProvider,
    googleMeetUrl: data.googleMeetUrl,
  })

  const groupId = asNullableString(data.groupId)

  return {
    id,
    title: asString(data.title),
    type: mapType(data.type),
    description: asString(data.description),
    notes: asString(data.notes),
    resultNotes: asString(data.resultNotes),
    status: mapStatus(data.status),
    startAt: data.startAt instanceof Timestamp ? data.startAt : null,
    endAt: data.endAt instanceof Timestamp ? data.endAt : null,
    durationMinutes:
      typeof data.durationMinutes === 'number' && Number.isFinite(data.durationMinutes)
        ? data.durationMinutes
        : 30,
    timezone: asString(data.timezone) || 'UTC',
    organizerId: asString(data.organizerId),
    organizerName: asString(data.organizerName),
    contactId: asNullableString(data.contactId),
    meetingAudience: mapAudience(data.meetingAudience, groupId),
    groupId,
    groupNameSnapshot: asNullableString(data.groupNameSnapshot),
    participants,
    participantUserIds: Array.isArray(data.participantUserIds)
      ? data.participantUserIds
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .map((value) => value.trim())
      : [],
    meetingMode: modeFields.meetingMode,
    videoProvider: modeFields.videoProvider,
    meetingUrl: modeFields.meetingUrl,
    location: modeFields.location,
    meetingProvider: modeFields.meetingProvider,
    googleCalendarEventId: asNullableString(data.googleCalendarEventId),
    googleCalendarHtmlLink: asNullableString(data.googleCalendarHtmlLink),
    googleMeetUrl: asNullableString(data.googleMeetUrl),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
    createdBy: asString(data.createdBy),
    updatedBy: asString(data.updatedBy),
    completedAt: data.completedAt instanceof Timestamp ? data.completedAt : null,
    cancelledAt: data.cancelledAt instanceof Timestamp ? data.cancelledAt : null,
    cancelledBy: asNullableString(data.cancelledBy),
    cancelReason: asNullableString(data.cancelReason),
    resultRecordedBy: asNullableString(data.resultRecordedBy),
    resultRecordedAt: data.resultRecordedAt instanceof Timestamp ? data.resultRecordedAt : null,
    nextActionTaskId: asNullableString(data.nextActionTaskId),
  }
}
