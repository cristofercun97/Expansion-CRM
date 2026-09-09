import type { Contact } from '@/features/contacts/types/contact.types'
import type {
  CreateMeetingInput,
  Meeting,
  MeetingFormValues,
  MeetingParticipant,
  UpdateMeetingInput,
} from '@/features/agenda/types/meeting.types'
import { MEETING_DURATION_OPTIONS } from '@/features/agenda/utils/meetingLabels'
import {
  combineLocalDateAndTime,
  getBrowserTimezone,
  timestampToDate,
  toDateInputValue,
  toTimeInputValue,
} from '@/features/agenda/utils/meetingDateUtils'

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
    participants: [],
    createGoogleMeet: true,
    ...defaults,
  }
}

export function buildMeetingFormValues(options: {
  mode: 'create' | 'edit'
  meeting?: Meeting | null
  contacts: Contact[]
  preselectedContactId?: string
  createGoogleMeetDefault: boolean
}): MeetingFormValues {
  const { mode, meeting, contacts, preselectedContactId, createGoogleMeetDefault } = options

  if (mode === 'edit' && meeting) {
    const start = timestampToDate(meeting.startAt) ?? new Date()
    const isPresetDuration = (MEETING_DURATION_OPTIONS as readonly number[]).includes(
      meeting.durationMinutes,
    )

    return createEmptyMeetingFormValues({
      title: meeting.title,
      type: meeting.type,
      description: meeting.description,
      notes: meeting.notes,
      date: toDateInputValue(start),
      time: toTimeInputValue(start),
      durationMinutes: isPresetDuration ? meeting.durationMinutes : 0,
      customDurationMinutes: isPresetDuration ? '' : String(meeting.durationMinutes),
      contactId: meeting.contactId ?? '',
      participants: meeting.participants,
      createGoogleMeet: Boolean(meeting.googleMeetUrl || meeting.googleCalendarEventId),
    })
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
    createGoogleMeet: createGoogleMeetDefault,
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

  return {
    title: values.title.trim(),
    type: values.type,
    description: values.description.trim(),
    notes: values.notes.trim(),
    startAt,
    durationMinutes: resolveDurationMinutes(values),
    timezone: getBrowserTimezone(),
    contactId: values.contactId.trim() || null,
    participants: values.participants.map(normalizeParticipant),
    createGoogleMeet: values.createGoogleMeet,
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
    participants: createInput.participants,
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
