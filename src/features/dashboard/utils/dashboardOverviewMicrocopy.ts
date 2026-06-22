import type { DashboardOverviewData } from '@/features/dashboard/types/dashboard-overview.types'
import type {
  DashboardAttentionItemType,
  DashboardCommercialGoalStatus,
} from '@/features/dashboard/types/dashboard-overview.types'
import { formatDashboardCurrency } from '@/features/dashboard/utils/dashboardOverviewFormatters'

export function resolveHeroSubtitle(
  overview: DashboardOverviewData,
  teamName?: string | null,
): string {
  const goal = overview.commercialGoal

  if (goal.status !== 'no_goal' && goal.progressPercent !== null) {
    const resolvedTeamName =
      teamName ||
      overview.ownedTeam?.teamName ||
      overview.homeTeam?.teamName ||
      'Tu grupo'

    const remainingPart =
      goal.remainingAmount !== null && goal.remainingAmount > 0
        ? ` Faltan ${formatDashboardCurrency(goal.remainingAmount)} para cerrar la meta:`
        : ':'

    return `${resolvedTeamName} ya avanzó el ${goal.progressPercent}% del objetivo mensual.${remainingPart} hoy toca enfocar al equipo.`
  }

  return 'Tu sistema está listo. Define una meta y convierte el avance del equipo en acciones visibles.'
}

export function resolveHeroEnergyLine(overview: DashboardOverviewData): string | null {
  return getCommercialGoalEnergyPhrase(overview.commercialGoal.status)
}

export function getCommercialGoalEnergyPhrase(status: DashboardCommercialGoalStatus): string | null {
  switch (status) {
    case 'completed':
      return 'Objetivo cumplido. Ahora toca reconocer al equipo.'
    case 'on_track':
      return 'Van con buen ritmo. La constancia está dando resultado.'
    case 'needs_attention':
      return 'Hay avance, pero el equipo necesita un empuje.'
    case 'at_risk':
      return 'El objetivo necesita foco inmediato.'
    case 'no_goal':
      return 'Sin meta clara, el equipo camina sin dirección.'
    default:
      return null
  }
}

export function getCommercialGoalHumanMessage(status: DashboardCommercialGoalStatus): string {
  switch (status) {
    case 'completed':
      return 'Objetivo cumplido. Es momento de reconocer al equipo.'
    case 'on_track':
      return 'El ritmo va bien. Mantén la constancia.'
    case 'needs_attention':
      return 'Hay avance, pero el equipo necesita un empuje esta semana.'
    case 'at_risk':
      return 'El objetivo necesita foco inmediato.'
    default:
      return 'Define una meta para que el equipo tenga dirección.'
  }
}

export function getAttentionHumanDescription(
  type: DashboardAttentionItemType,
  fallback: string,
): string {
  switch (type) {
    case 'unread_reminders':
      return 'Hay mensajes del grupo esperando tu revisión.'
    case 'pending_tasks':
      return 'Tienes acciones del plan que merecen tu foco hoy.'
    case 'hot_contacts':
      return 'Personas interesadas que conviene atender pronto.'
    case 'pending_sales':
      return 'Ventas reportadas listas para tu validación.'
    case 'pending_payouts':
      return 'Solicitudes de pago esperando gestión.'
    case 'inactive_members':
      return 'Algunos miembros aún no dieron el primer paso. Acompáñalos.'
    default:
      return fallback
  }
}

export function getAttentionActionLabel(type: DashboardAttentionItemType): string {
  switch (type) {
    case 'unread_reminders':
      return 'Revisar recordatorios'
    case 'pending_tasks':
      return 'Ir al plan de acción'
    case 'hot_contacts':
      return 'Ver contactos'
    case 'pending_sales':
      return 'Validar ventas'
    case 'pending_payouts':
      return 'Gestionar pagos'
    case 'inactive_members':
      return 'Ver mi grupo'
    default:
      return 'Ver detalle'
  }
}

export function formatPayoutStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
      return 'pagada'
    case 'rejected':
      return 'rechazada'
    case 'pending':
    case 'requested':
      return 'en revisión'
    case 'approved':
      return 'aprobada'
    default:
      return status
  }
}

export function formatScopeMetricValue(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) {
    return 'Sin datos todavía'
  }

  return `${value}${suffix}`
}
