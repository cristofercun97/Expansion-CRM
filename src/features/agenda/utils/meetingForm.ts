import type { Contact } from '@/features/contacts/types/contact.types'
import type {
  CreateMeetingInput,
  Meeting,
  MeetingAudience,
  MeetingFormValues,
  MeetingMode,
  MeetingParticipant,
  UpdateMeetingInput,
  VideoProvider,
} from '@/features/agenda/types/meeting.types'
import { MEETING_DURATION_OPTIONS } from '@/features/agenda/utils/meetingLabels'
import {
  combineLocalDateAndTime,
  getBrowserTimezone,
  timestampToDate,
  toDateInputValue,
  toTimeInputValue,
} from '@/features/agenda/utils/meetingDateUtils'
import { isValidHttpsMeetingUrl } from '@/features/agenda/utils/meetingModeUtils'

export type MeetingFormErrors = Partial<Record<keyof MeetingFormValues, string>> & {
  form?: string
}

export function createEmptyMeetingFormValues(
  defaults?: Partial<MeetingFormValues>,
): MeetingFormValues {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')

  return {
    title: '',
    type: 'follow_up',
    description: '',
    notes: '',
    date: `${year}-${month}-${day}`,
    time: `${hours}:00`,
    durationMinutes: 30,
    customDurationMinutes: '',
    contactId: '',
    meetingAudience: 'individual',
    groupId: '',
    groupNameSnapshot: '',
    groupMemberSelectionMode: 'all',
    participants: [],
    meetingMode: 'video',
    videoLinkMethod: 'manual',
    meetingUrl: '',
    location: '',
    recurrenceEnabled: false,
    recurrenceFrequency: 'weekly',
    recurrenceEndMode: 'count',
    recurrenceCount: '4',
    recurrenceUntilDate: '',
    ...defaults,
  }
}

function formFromMeeting(meeting: Meeting): Partial<MeetingFormValues> {
  const start = timestampToDate(meeting.startAt) ?? new Date()
  const isPresetDuration = (MEETING_DURATION_OPTIONS as readonly number[]).includes(
    meeting.durationMinutes,
  )

  let videoLinkMethod: MeetingFormValues['videoLinkMethod'] = 'manual'
  if (meeting.videoProvider === 'google_meet') {
    videoLinkMethod = 'google_meet'
  }

  return {
    title: meeting.title,
    type: meeting.type,
    description: meeting.description,
    notes: meeting.notes,
    date: toDateInputValue(start),
    time: toTimeInputValue(start),
    durationMinutes: isPresetDuration ? meeting.durationMinutes : 0,
    customDurationMinutes: isPresetDuration ? '' : String(meeting.durationMinutes),
    contactId: meeting.contactId ?? '',
    meetingAudience: meeting.meetingAudience,
    groupId: meeting.groupId ?? '',
    groupNameSnapshot: meeting.groupNameSnapshot ?? '',
    groupMemberSelectionMode: 'partial',
    participants: meeting.participants,
    meetingMode: meeting.meetingMode,
    videoLinkMethod,
    meetingUrl:
      meeting.videoProvider === 'manual'
        ? meeting.meetingUrl ?? ''
        : meeting.meetingUrl ?? meeting.googleMeetUrl ?? '',
    location: meeting.location ?? '',
  }
}

export function buildMeetingFormValues(options: {
  mode: 'create' | 'edit'
  meeting?: Meeting | null
  contacts: Contact[]
  preselectedContactId?: string
  preferGoogleMeetDefault: boolean
}): MeetingFormValues {
  const { mode, meeting, contacts, preselectedContactId, preferGoogleMeetDefault } = options

  if (mode === 'edit' && meeting) {
    return createEmptyMeetingFormValues(formFromMeeting(meeting))
  }

  const contact = contacts.find((item) => item.id === preselectedContactId)
  const participants: MeetingParticipant[] = contact
    ? [
        {
          type: 'contact',
          contactId: contact.id,
          name: contact.name,
        },
      ]
    : []

  return createEmptyMeetingFormValues({
    contactId: preselectedContactId ?? '',
    participants,
    title: contact ? `Seguimiento con ${contact.name}` : '',
    meetingMode: 'video',
    videoLinkMethod: preferGoogleMeetDefault ? 'google_meet' : 'manual',
  })
}

export function resolveDurationMinutes(values: MeetingFormValues): number {
  if ((MEETING_DURATION_OPTIONS as readonly number[]).includes(values.durationMinutes)) {
    return values.durationMinutes
  }

  const custom = Number(values.customDurationMinutes)
  return Number.isFinite(custom) ? custom : NaN
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function resolveVideoProvider(values: MeetingFormValues): VideoProvider {
  if (values.meetingMode !== 'video') {
    return 'none'
  }
  return values.videoLinkMethod === 'google_meet' ? 'google_meet' : 'manual'
}

export function validateMeetingForm(values: MeetingFormValues): MeetingFormErrors {
  const errors: MeetingFormErrors = {}

  if (!values.title.trim()) {
    errors.title = 'El título es obligatorio.'
  }

  if (!values.date) {
    errors.date = 'La fecha es obligatoria.'
  }

  if (!values.time) {
    errors.time = 'La hora es obligatoria.'
  }

  const startAt = combineLocalDateAndTime(values.date, values.time)
  if (!startAt) {
    errors.date = errors.date ?? 'Fecha u hora no válidas.'
  }

  const duration = resolveDurationMinutes(values)
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    errors.customDurationMinutes = 'La duración debe estar entre 5 y 480 minutos.'
  }

  if (values.meetingAudience === 'group') {
    if (!values.groupId.trim()) {
      errors.groupId = 'Selecciona un grupo.'
    }

    const userParticipants = values.participants.filter((item) => item.type === 'user')
    if (userParticipants.length === 0) {
      errors.form = 'El grupo no tiene miembros disponibles o no hay participantes seleccionados.'
    }
  }

  if (values.meetingMode === 'video' && values.videoLinkMethod === 'manual') {
    const url = values.meetingUrl.trim()
    if (!url) {
      errors.meetingUrl = 'Añade el enlace de la videollamada.'
    } else if (!isValidHttpsMeetingUrl(url)) {
      errors.meetingUrl = 'Usa una URL HTTPS válida (Meet, Zoom, Teams u otra).'
    }
  }

  const emails = new Set<string>()
  for (const participant of values.participants) {
    const email = participant.email?.trim().toLowerCase()
    if (!email) {
      if (participant.type === 'external') {
        errors.form = 'Los invitados externos necesitan un email.'
        break
      }
      continue
    }

    if (!isValidEmail(email)) {
      errors.form = `Email no válido: ${participant.email}`
      break
    }

    if (emails.has(email)) {
      errors.form = 'Hay participantes duplicados por email.'
      break
    }

    emails.add(email)
  }

  if (values.recurrenceEnabled) {
    if (values.recurrenceEndMode === 'count') {
      const count = Number(values.recurrenceCount)
      if (!Number.isInteger(count) || count < 1) {
        errors.recurrenceCount = 'Indica un número válido de reuniones.'
      } else if (count > 52) {
        errors.recurrenceCount = 'Máximo 52 reuniones.'
      }
    } else if (!values.recurrenceUntilDate) {
      errors.recurrenceUntilDate = 'Indica la fecha de finalización.'
    }
  }

  return errors
}

export function toCreateMeetingInput(
  values: MeetingFormValues,
  organizerName = '',
): CreateMeetingInput {
  const startAt = combineLocalDateAndTime(values.date, values.time)
  if (!startAt) {
    throw new Error('Fecha u hora no válidas.')
  }

  const meetingMode: MeetingMode = values.meetingMode
  const videoProvider = resolveVideoProvider(values)
  const meetingUrl =
    meetingMode === 'video' && videoProvider === 'manual'
      ? values.meetingUrl.trim()
      : null
  const location =
    meetingMode === 'in_person' && values.location.trim()
      ? values.location.trim()
      : null

  const meetingAudience: MeetingAudience = values.meetingAudience
  const groupId =
    meetingAudience === 'group' && values.groupId.trim() ? values.groupId.trim() : null
  const groupNameSnapshot =
    meetingAudience === 'group' && values.groupNameSnapshot.trim()
      ? values.groupNameSnapshot.trim()
      : null

  return {
    title: values.title.trim(),
    type: meetingAudience === 'group' ? 'group' : values.type,
    description: values.description.trim(),
    notes: values.notes.trim(),
    startAt,
    durationMinutes: resolveDurationMinutes(values),
    timezone: getBrowserTimezone(),
    contactId: meetingAudience === 'individual' ? values.contactId.trim() || null : null,
    meetingAudience,
    groupId,
    groupNameSnapshot,
    groupMemberSelectionMode:
      meetingAudience === 'group' ? values.groupMemberSelectionMode : undefined,
    participants: values.participants.map(normalizeParticipant),
    meetingMode,
    videoProvider,
    meetingUrl,
    location,
    organizerName: organizerName.trim(),
  }
}

export function toUpdateMeetingInput(
  values: MeetingFormValues,
  syncGoogle: boolean,
  organizerName = '',
): UpdateMeetingInput {
  const createInput = toCreateMeetingInput(values, organizerName)
  return {
    title: createInput.title,
    type: createInput.type,
    description: createInput.description,
    notes: createInput.notes,
    startAt: createInput.startAt,
    durationMinutes: createInput.durationMinutes,
    timezone: createInput.timezone,
    contactId: createInput.contactId,
    meetingAudience: createInput.meetingAudience,
    groupId: createInput.groupId,
    groupNameSnapshot: createInput.groupNameSnapshot,
    groupMemberSelectionMode: createInput.groupMemberSelectionMode,
    participants: createInput.participants,
    meetingMode: createInput.meetingMode,
    videoProvider: createInput.videoProvider,
    meetingUrl: createInput.meetingUrl,
    location: createInput.location,
    syncGoogle,
  }
}

function normalizeParticipant(participant: MeetingParticipant): MeetingParticipant {
  return {
    type: participant.type,
    userId: participant.userId?.trim() || undefined,
    contactId: participant.contactId?.trim() || undefined,
    name: participant.name.trim(),
    email: participant.email?.trim().toLowerCase() || undefined,
  }
}
