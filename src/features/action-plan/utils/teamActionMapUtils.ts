import type {
  TeamMapPeriodType,
  TeamMapStatus,
} from '@/features/action-plan/types/team-action-map.types'

export const TEAM_MAP_PERIOD_OPTIONS: { value: TeamMapPeriodType; label: string }[] = [
  { value: '30_days', label: '30 días — Corto plazo' },
  { value: '60_days', label: '60 días — Corto plazo' },
  { value: '90_days', label: '90 días — Mediano plazo' },
  { value: '6_months', label: '6 meses — Mediano plazo' },
  { value: '1_year', label: '1 año — Largo plazo' },
]

export const TEAM_MAP_STATUS_OPTIONS: { value: TeamMapStatus; label: string }[] = [
  { value: 'green', label: 'Verde — Vamos bien' },
  { value: 'yellow', label: 'Amarillo — Necesita atención' },
  { value: 'red', label: 'Rojo — Requiere acción' },
]

export const DEFAULT_MAIN_OBJECTIVE_TEMPLATE =
  'Lograr que el equipo avance de forma constante, complete su formación inicial y convierta sus objetivos en acciones semanales.'

export const DEFAULT_VISION_TEMPLATE =
  'Construir un equipo comprometido, formado y activo, donde cada miembro tenga claridad sobre su siguiente paso.'

export type SuggestedTeamMapAreaTemplate = {
  title: string
  objective: string
  indicator: string
}

export const SUGGESTED_TEAM_MAP_AREA_TEMPLATES: SuggestedTeamMapAreaTemplate[] = [
  {
    title: 'Formación',
    objective: 'Que los miembros completen los módulos base y entiendan el sistema.',
    indicator: '% de miembros con módulos revisados y tests realizados.',
  },
  {
    title: 'Participación',
    objective: 'Aumentar la actividad y presencia de los miembros dentro del grupo.',
    indicator: 'Número de miembros activos durante la semana.',
  },
  {
    title: 'Prospección',
    objective: 'Generar nuevos contactos y conversaciones de oportunidad.',
    indicator: 'Número de prospectos/contactos registrados o conversaciones iniciadas.',
  },
  {
    title: 'Seguimiento',
    objective: 'Acompañar a los miembros que necesitan apoyo para avanzar.',
    indicator: 'Número de recordatorios enviados y miembros recuperados.',
  },
  {
    title: 'Resultados',
    objective: 'Convertir las acciones del equipo en resultados medibles.',
    indicator: 'Tareas completadas, avances logrados y objetivos cumplidos.',
  },
]

export const SUGGESTED_TEAM_MAP_AREAS = SUGGESTED_TEAM_MAP_AREA_TEMPLATES.map(
  (template) => template.title,
)

export const MAX_TEAM_MAP_AREAS = 12

export function getSuggestedAreaTemplate(title: string): SuggestedTeamMapAreaTemplate | null {
  const normalizedTitle = title.trim().toLowerCase()

  return (
    SUGGESTED_TEAM_MAP_AREA_TEMPLATES.find(
      (template) => template.title.toLowerCase() === normalizedTitle,
    ) ?? null
  )
}

export const LEGACY_MAIN_OBJECTIVE_FALLBACK = 'Objetivo pendiente de definir'

const DEFAULT_LEGACY_PERIOD: TeamMapPeriodType = '90_days'

export function getTeamMapPeriodLabel(periodType: TeamMapPeriodType): string {
  return (
    TEAM_MAP_PERIOD_OPTIONS.find((option) => option.value === periodType)?.label ??
    '90 días — Mediano plazo'
  )
}

export function getTeamMapStatusLabel(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'Verde — Vamos bien'
    case 'yellow':
      return 'Amarillo — Necesita atención'
    case 'red':
      return 'Rojo — Requiere acción'
  }
}

export function getTeamMapStatusBadgeClassName(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'border-teal-accent/35 bg-teal-accent/15 text-teal-accent'
    case 'yellow':
      return 'border-amber-400/35 bg-amber-500/15 text-amber-100'
    case 'red':
      return 'border-red-400/35 bg-red-500/15 text-red-200'
  }
}

export function getTeamMapStatusShortLabel(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'Verde'
    case 'yellow':
      return 'Amarillo'
    case 'red':
      return 'Rojo'
  }
}

/** Valor simple de avance por semáforo: verde 100, amarillo 60, rojo 20. */
export function getTeamMapStatusProgressValue(status: TeamMapStatus): number {
  switch (status) {
    case 'green':
      return 100
    case 'yellow':
      return 60
    case 'red':
      return 20
  }
}

export function getTeamMapStatusBarClassName(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'bg-teal-accent'
    case 'yellow':
      return 'bg-amber-400'
    case 'red':
      return 'bg-red-400'
  }
}

export function getTeamMapStatusAccentClassName(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'border-teal-accent/40 bg-teal-accent/10'
    case 'yellow':
      return 'border-amber-400/40 bg-amber-500/10'
    case 'red':
      return 'border-red-400/40 bg-red-500/10'
  }
}

export function getTeamMapStatusDotClassName(status: TeamMapStatus): string {
  switch (status) {
    case 'green':
      return 'bg-teal-accent shadow-[0_0_10px_rgba(106,197,188,0.55)]'
    case 'yellow':
      return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]'
    case 'red':
      return 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]'
  }
}

export function calculateTeamMapGeneralProgress(
  areas: Array<{ status?: TeamMapStatus }>,
  fallbackStatus: TeamMapStatus = 'yellow',
): number {
  if (areas.length === 0) {
    return getTeamMapStatusProgressValue(fallbackStatus)
  }

  const total = areas.reduce(
    (sum, area) => sum + getTeamMapStatusProgressValue(area.status ?? 'yellow'),
    0,
  )

  return Math.round(total / areas.length)
}

export function parseTeamMapPeriodType(value: unknown): TeamMapPeriodType | null {
  if (
    value === '30_days' ||
    value === '60_days' ||
    value === '90_days' ||
    value === '6_months' ||
    value === '1_year'
  ) {
    return value
  }

  return null
}

export function parseTeamMapStatus(value: unknown): TeamMapStatus | null {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value
  }

  return null
}

export function parseTeamMapDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    return null
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : null
}

export function resolveLegacyMainObjective(
  mainObjective: unknown,
  description: unknown,
): string {
  if (typeof mainObjective === 'string' && mainObjective.trim().length > 0) {
    return mainObjective.trim()
  }

  if (typeof description === 'string' && description.trim().length > 0) {
    return description.trim()
  }

  return LEGACY_MAIN_OBJECTIVE_FALLBACK
}

export function resolveLegacyPeriodType(value: unknown): TeamMapPeriodType {
  return parseTeamMapPeriodType(value) ?? DEFAULT_LEGACY_PERIOD
}

export function resolveLegacyPeriodLabel(
  periodType: TeamMapPeriodType,
  periodLabel: unknown,
): string {
  if (typeof periodLabel === 'string' && periodLabel.trim().length > 0) {
    return periodLabel.trim()
  }

  return getTeamMapPeriodLabel(periodType)
}

export function resolveLegacyStatus(value: unknown): TeamMapStatus {
  return parseTeamMapStatus(value) ?? 'yellow'
}

export function formatTeamMapDateLabel(value: string | null): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTeamMapDateRange(
  startDate: string | null,
  endDate: string | null,
): string | null {
  const startLabel = formatTeamMapDateLabel(startDate)
  const endLabel = formatTeamMapDateLabel(endDate)

  if (startLabel && endLabel) {
    return `${startLabel} – ${endLabel}`
  }

  if (startLabel) {
    return `Desde ${startLabel}`
  }

  if (endLabel) {
    return `Hasta ${endLabel}`
  }

  return null
}
