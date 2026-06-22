import type { TeamReminderType } from '@/features/reminders/types/reminder.types'

export const REMINDER_TYPE_OPTIONS: { value: TeamReminderType; label: string }[] = [
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'academy', label: 'Academia' },
  { value: 'task', label: 'Plan de Acción' },
  { value: 'recognition', label: 'Reconocimiento' },
  { value: 'sales_report', label: 'Venta reportada' },
]

export function getTeamReminderTypeLabel(type: TeamReminderType): string {
  return REMINDER_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
}

export function buildDefaultReminderContent(
  memberName: string,
  priority: 'high' | 'medium' | 'low',
  overallStatus: 'not_started' | 'in_follow_up' | 'good_progress' | 'excellent',
): { title: string; message: string } {
  const firstName = memberName.trim().split(/\s+/)[0] || memberName

  if (priority === 'high') {
    return {
      title: 'Te ayudamos a comenzar',
      message: `Hola ${firstName}, vimos que aún no has iniciado tus avances. Te recomendamos comenzar con el primer módulo y marcar tu progreso paso a paso.`,
    }
  }

  if (priority === 'medium') {
    return {
      title: 'Sigamos avanzando',
      message: `Hola ${firstName}, ya tienes algo de avance. Revisa tus objetivos pendientes y continúa con el siguiente paso.`,
    }
  }

  if (priority === 'low' || overallStatus === 'excellent') {
    return {
      title: 'Buen avance',
      message: `Hola ${firstName}, vas muy bien. Sigue manteniendo el ritmo y completa los próximos objetivos.`,
    }
  }

  return {
    title: 'Buen avance',
    message: `Hola ${firstName}, vas muy bien. Sigue manteniendo el ritmo y completa los próximos objetivos.`,
  }
}
