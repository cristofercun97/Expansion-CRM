import type {
  MeetingStatus,
  MeetingType,
} from '@/features/agenda/types/meeting.types'

export const MEETING_TYPE_OPTIONS: Array<{ value: MeetingType; label: string }> = [
  { value: 'individual', label: 'Individual' },
  { value: 'group', label: 'Grupal' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'presentation', label: 'Presentación' },
  { value: 'training', label: 'Formación' },
  { value: 'evaluation', label: 'Evaluación' },
  { value: 'other', label: 'Otro' },
]

export const MEETING_DURATION_OPTIONS = [15, 30, 45, 60] as const

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Programada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
  rescheduled: 'Reprogramada',
}

export const MEETING_MODE_OPTIONS = [
  { value: 'video' as const, label: 'Videollamada' },
  { value: 'in_person' as const, label: 'Presencial' },
  { value: 'other' as const, label: 'Otro' },
]

export function getMeetingTypeLabel(type: MeetingType): string {
  return MEETING_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Otro'
}

export function getMeetingStatusLabel(status: MeetingStatus): string {
  return MEETING_STATUS_LABELS[status] ?? status
}
