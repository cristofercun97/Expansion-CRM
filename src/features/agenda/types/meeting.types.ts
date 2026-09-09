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

export type MeetingParticipantType = 'user' | 'contact' | 'external'

export type MeetingProvider = 'google_meet' | 'none'

export type MeetingParticipant = {
  type: MeetingParticipantType
  userId?: string
  contactId?: string
  name: string
  email?: string
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
  groupId: string | null
  participants: MeetingParticipant[]
  /** UIDs de usuarios internos invitados (autorización; no usar email). */
  participantUserIds: string[]
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
  participants: MeetingParticipant[]
  createGoogleMeet: boolean
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
  participants: MeetingParticipant[]
  createGoogleMeet: boolean
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
  participants: MeetingParticipant[]
  syncGoogle: boolean
}

export type GoogleCalendarConnectionStatus = {
  connected: boolean
  email: string | null
  configured: boolean
}

export type AgendaViewMode = 'list' | 'week' | 'month'

export type AgendaStatusFilter = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'
