import type { Timestamp } from 'firebase/firestore'

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'

export type MeetingType =
  | 'individual'
  | 'group'
  | 'follow_up'
  | 'presentation'
  | 'training'
  | 'evaluation'
  | 'other'

/** Audience: individual contact/users vs group meeting. Legacy docs without field ⇒ individual. */
export type MeetingAudience = 'individual' | 'group'

export type GroupMemberSelectionMode = 'all' | 'partial'

/** Cómo se celebra la reunión (fuente de verdad EXPANSIÓN). */
export type MeetingMode = 'video' | 'in_person' | 'other'

/** Proveedor de videollamada. `none` = sin enlace / no aplica. */
export type VideoProvider = 'manual' | 'google_meet' | 'none'

export type MeetingParticipantType = 'user' | 'contact' | 'external'

/** @deprecated Prefer videoProvider. Conservado por compatibilidad. */
export type MeetingProvider = 'google_meet' | 'none'

export type MeetingParticipant = {
  type: MeetingParticipantType
  userId?: string
  contactId?: string
  name: string
  email?: string
}

export type MeetingHistoryType =
  | 'created'
  | 'rescheduled'
  | 'completed'
  | 'no_show'
  | 'cancelled'

export type MeetingHistoryEvent = {
  id: string
  type: MeetingHistoryType
  changedBy: string
  changedAt: Timestamp | null
  previousStartAt?: Timestamp | null
  previousEndAt?: Timestamp | null
  newStartAt?: Timestamp | null
  newEndAt?: Timestamp | null
  reason?: string | null
  resultNotes?: string | null
}

export type Meeting = {
  id: string
  title: string
  type: MeetingType
  description: string
  notes: string
  resultNotes: string
  status: MeetingStatus
  startAt: Timestamp | null
  endAt: Timestamp | null
  durationMinutes: number
  timezone: string
  organizerId: string
  organizerName: string
  contactId: string | null
  meetingAudience: MeetingAudience
  groupId: string | null
  groupNameSnapshot: string | null
  participants: MeetingParticipant[]
  /** UIDs de usuarios internos invitados (autorización; no usar email). */
  participantUserIds: string[]
  meetingMode: MeetingMode
  videoProvider: VideoProvider
  meetingUrl: string | null
  location: string | null
  /** Compatibilidad legacy con documentos previos. */
  meetingProvider: MeetingProvider
  googleCalendarEventId: string | null
  googleCalendarHtmlLink: string | null
  googleMeetUrl: string | null
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  createdBy: string
  updatedBy: string
  completedAt: Timestamp | null
  cancelledAt: Timestamp | null
  cancelledBy: string | null
  cancelReason: string | null
  resultRecordedBy: string | null
  resultRecordedAt: Timestamp | null
}

export type MeetingFormValues = {
  title: string
  type: MeetingType
  description: string
  notes: string
  date: string
  time: string
  durationMinutes: number
  customDurationMinutes: string
  contactId: string
  meetingAudience: MeetingAudience
  groupId: string
  groupNameSnapshot: string
  groupMemberSelectionMode: GroupMemberSelectionMode
  participants: MeetingParticipant[]
  meetingMode: MeetingMode
  /** Solo relevante si meetingMode === 'video' */
  videoLinkMethod: 'manual' | 'google_meet'
  meetingUrl: string
  location: string
}

export type CreateMeetingInput = {
  title: string
  type: MeetingType
  description: string
  notes: string
  startAt: Date
  durationMinutes: number
  timezone: string
  contactId: string | null
  meetingAudience: MeetingAudience
  groupId: string | null
  groupNameSnapshot: string | null
  groupMemberSelectionMode?: GroupMemberSelectionMode
  participants: MeetingParticipant[]
  meetingMode: MeetingMode
  videoProvider: VideoProvider
  meetingUrl: string | null
  location: string | null
  organizerName: string
}

export type UpdateMeetingInput = {
  title: string
  type: MeetingType
  description: string
  notes: string
  startAt: Date
  durationMinutes: number
  timezone: string
  contactId: string | null
  meetingAudience: MeetingAudience
  groupId: string | null
  groupNameSnapshot: string | null
  groupMemberSelectionMode?: GroupMemberSelectionMode
  participants: MeetingParticipant[]
  meetingMode: MeetingMode
  videoProvider: VideoProvider
  meetingUrl: string | null
  location: string | null
  syncGoogle: boolean
}

export type RescheduleMeetingInput = {
  startAt: Date
  durationMinutes: number
  timezone: string
  reason?: string
}

export type RecordMeetingResultInput = {
  outcome: 'completed' | 'no_show' | 'cancelled'
  resultNotes?: string
  cancelReason?: string
}

export type GoogleCalendarConnectionStatus = {
  connected: boolean
  email: string | null
  configured: boolean
}

export type AgendaViewMode = 'list' | 'week' | 'month'

export type AgendaStatusFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'
