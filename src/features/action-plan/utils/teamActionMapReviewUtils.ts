import type { TeamActionMapReviewWeeklyStatus } from '@/features/action-plan/types/team-action-map-review.types'
import {
  getTeamMapStatusBadgeClassName,
  getTeamMapStatusDotClassName,
  getTeamMapStatusLabel,
} from '@/features/action-plan/utils/teamActionMapUtils'

export const DEFAULT_WEEKLY_REVIEW_WEEK_LABEL = 'Semana actual'

export const WEEKLY_REVIEW_PROGRESS_IDEA =
  'El equipo mostró movimiento en las acciones clave y se identificaron miembros con buen progreso.'

export const WEEKLY_REVIEW_BLOCKERS_IDEA =
  'Algunos miembros necesitan seguimiento para completar sus acciones y mantener el ritmo.'

export const WEEKLY_REVIEW_ADJUSTMENTS_IDEA =
  'Enfocar la semana en acompañamiento, recordatorios y cumplimiento de las acciones prioritarias.'

export type WeeklyReviewChip = {
  id: string
  label: string
  text: string
}

export const WEEKLY_REVIEW_PROGRESS_CHIPS: WeeklyReviewChip[] = [
  { id: 'modules', label: 'Se completaron módulos', text: 'Se completaron módulos' },
  { id: 'participation', label: 'Hubo más participación', text: 'Hubo más participación' },
  { id: 'prospecting', label: 'Se movió la prospección', text: 'Se movió la prospección' },
  { id: 'reminders', label: 'Se enviaron recordatorios', text: 'Se enviaron recordatorios' },
  {
    id: 'key_tasks',
    label: 'Se completaron tareas clave',
    text: 'Se completaron tareas clave',
  },
  {
    id: 'attitude',
    label: 'El equipo mostró mejor actitud',
    text: 'El equipo mostró mejor actitud',
  },
]

export const WEEKLY_REVIEW_BLOCKER_CHIPS: WeeklyReviewChip[] = [
  { id: 'consistency', label: 'Falta de constancia', text: 'Falta de constancia' },
  { id: 'low_participation', label: 'Poca participación', text: 'Poca participación' },
  { id: 'not_started', label: 'Miembros sin iniciar', text: 'Miembros sin iniciar' },
  { id: 'low_prospecting', label: 'Poca prospección', text: 'Poca prospección' },
  { id: 'no_followup', label: 'Falta de seguimiento', text: 'Falta de seguimiento' },
  { id: 'pending_tasks', label: 'Tareas pendientes', text: 'Tareas pendientes' },
]

export const WEEKLY_REVIEW_ADJUSTMENT_CHIPS: WeeklyReviewChip[] = [
  { id: 'reminders', label: 'Enviar recordatorios', text: 'Enviar recordatorios' },
  { id: 'training', label: 'Reforzar formación', text: 'Reforzar formación' },
  { id: 'prospecting', label: 'Enfocar la prospección', text: 'Enfocar la prospección' },
  { id: 'pending_tasks', label: 'Revisar tareas pendientes', text: 'Revisar tareas pendientes' },
  {
    id: 'accompany',
    label: 'Acompañar miembros con bajo avance',
    text: 'Acompañar miembros con bajo avance',
  },
  {
    id: 'recognize',
    label: 'Reconocer a quienes avanzaron',
    text: 'Reconocer a quienes avanzaron',
  },
]

export const WEEKLY_REVIEW_STATUS_OPTIONS: ReadonlyArray<{
  value: TeamActionMapReviewWeeklyStatus
  label: string
  description: string
}> = [
  { value: 'green', label: 'Verde', description: 'El equipo avanzó bien' },
  { value: 'yellow', label: 'Amarillo', description: 'Hay avances, pero necesita atención' },
  { value: 'red', label: 'Rojo', description: 'Hay bloqueos y toca actuar' },
]

export type WeeklyReviewStatusDefaults = {
  progressSummary: string
  blockers: string
  nextAdjustments: string
}

const WEEKLY_REVIEW_STATUS_DEFAULTS: Record<TeamActionMapReviewWeeklyStatus, WeeklyReviewStatusDefaults> =
  {
    green: {
      progressSummary:
        'El equipo avanzó bien esta semana y mantuvo buen ritmo en las acciones clave.',
      blockers: 'No se identificaron bloqueos críticos que detengan al grupo.',
      nextAdjustments: 'Mantener el enfoque y reconocer los avances logrados.',
    },
    yellow: {
      progressSummary:
        'Hubo avances, pero el ritmo del equipo necesita atención en algunas áreas.',
      blockers: 'Algunos miembros o acciones requieren seguimiento para no perder impulso.',
      nextAdjustments:
        'Enfocar la semana en acompañamiento, recordatorios y cumplimiento de prioridades.',
    },
    red: {
      progressSummary:
        'El avance de la semana fue limitado y el equipo necesita recuperar dirección.',
      blockers: 'Hay bloqueos claros que están frenando el movimiento del grupo.',
      nextAdjustments:
        'Actuar con acompañamiento directo, priorizar tareas clave y reforzar el seguimiento.',
    },
  }

export function getWeeklyReviewStatusDefaults(
  status: TeamActionMapReviewWeeklyStatus,
): WeeklyReviewStatusDefaults {
  return WEEKLY_REVIEW_STATUS_DEFAULTS[status]
}

export function buildReviewTextFromChips(
  chips: WeeklyReviewChip[],
  selectedIds: string[],
): string {
  const selectedTexts = chips
    .filter((chip) => selectedIds.includes(chip.id))
    .map((chip) => chip.text)

  if (selectedTexts.length === 0) {
    return ''
  }

  return selectedTexts.join('. ') + '.'
}

export function resolveWeeklyReviewWeekLabel(weekLabel: string): string {
  const trimmed = weekLabel.trim()
  return trimmed || DEFAULT_WEEKLY_REVIEW_WEEK_LABEL
}

export function getWeeklyReviewStatusLabel(status: TeamActionMapReviewWeeklyStatus): string {
  return getTeamMapStatusLabel(status)
}

export function getWeeklyReviewStatusBadgeClassName(
  status: TeamActionMapReviewWeeklyStatus,
): string {
  return getTeamMapStatusBadgeClassName(status)
}

export function getWeeklyReviewStatusDotClassName(
  status: TeamActionMapReviewWeeklyStatus,
): string {
  return getTeamMapStatusDotClassName(status)
}

export type WeeklyReviewFormValues = {
  weekLabel: string
  weekStartDate: string
  weekEndDate: string
  progressSummary: string
  blockers: string
  nextAdjustments: string
  weeklyStatus: TeamActionMapReviewWeeklyStatus | ''
}

export const DEFAULT_WEEKLY_REVIEW_FORM: WeeklyReviewFormValues = {
  weekLabel: '',
  weekStartDate: '',
  weekEndDate: '',
  progressSummary: '',
  blockers: '',
  nextAdjustments: '',
  weeklyStatus: '',
}

export type WeeklyReviewFormErrors = Partial<Record<keyof WeeklyReviewFormValues, string>>

export function validateWeeklyReviewForm(values: WeeklyReviewFormValues): WeeklyReviewFormErrors {
  const errors: WeeklyReviewFormErrors = {}
  const resolvedWeekLabel = resolveWeeklyReviewWeekLabel(values.weekLabel)

  if (resolvedWeekLabel.length > 200) {
    errors.weekLabel = 'La etiqueta de semana es demasiado larga.'
  }

  if (!values.weeklyStatus) {
    errors.weeklyStatus = 'Selecciona el estado de la semana.'
  }

  if (!values.progressSummary.trim()) {
    errors.progressSummary = 'Indica qué avanzó esta semana.'
  } else if (values.progressSummary.trim().length > 2000) {
    errors.progressSummary = 'El resumen de avance es demasiado largo.'
  }

  if (!values.blockers.trim()) {
    errors.blockers = 'Indica qué está bloqueado.'
  } else if (values.blockers.trim().length > 2000) {
    errors.blockers = 'El texto de bloqueos es demasiado largo.'
  }

  if (!values.nextAdjustments.trim()) {
    errors.nextAdjustments = 'Indica qué ajustarán la próxima semana.'
  } else if (values.nextAdjustments.trim().length > 2000) {
    errors.nextAdjustments = 'El texto de ajustes es demasiado largo.'
  }

  return errors
}

export function hasWeeklyReviewFormErrors(errors: WeeklyReviewFormErrors): boolean {
  return Object.keys(errors).length > 0
}
