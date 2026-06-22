import type {
  SalesGoalCurrency,
  SalesGoalPeriodType,
  TeamSalesGoal,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import type { AppUser } from '@/types'
import { resolveLeaderTeamId } from '@/features/team/utils/teamContextUtils'

export type SalesGoalProgressStatus = 'in_progress' | 'near_goal' | 'achieved'

export type SalesGoalProgress = {
  targetAmount: number
  validatedAmount: number
  remainingAmount: number
  percentage: number
  status: SalesGoalProgressStatus
  statusLabel: string
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export function getCurrentWeeklySalesPeriod(referenceDate = new Date()) {
  const date = startOfDay(referenceDate)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const weekStart = startOfDay(new Date(date))
  weekStart.setDate(date.getDate() + diffToMonday)
  const weekEnd = endOfDay(new Date(weekStart))
  weekEnd.setDate(weekStart.getDate() + 6)

  const weekKey = `${toIsoDate(weekStart)}_${toIsoDate(weekEnd)}`
  const weekLabel = `${weekStart.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })} – ${weekEnd.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`

  return { weekKey, weekLabel, weekStartIso: toIsoDate(weekStart), weekEndIso: toIsoDate(weekEnd) }
}

export function getCurrentMonthlySalesPeriod(referenceDate = new Date()) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const monthKey = `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}`
  const monthLabel = monthStart.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return {
    monthKey,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  }
}

export function buildSalesPeriodKey(
  periodType: SalesGoalPeriodType,
  referenceDate = new Date(),
): { periodKey: string; periodLabel: string } {
  if (periodType === 'monthly') {
    const month = getCurrentMonthlySalesPeriod(referenceDate)
    return {
      periodKey: `monthly_${month.monthKey}`,
      periodLabel: month.monthLabel,
    }
  }

  const week = getCurrentWeeklySalesPeriod(referenceDate)
  return {
    periodKey: `weekly_${week.weekKey}`,
    periodLabel: week.weekLabel,
  }
}

export function buildSalesGoalDocId(teamId: string, periodKey: string): string {
  return `${teamId.trim()}_${periodKey.trim()}`
}

export function formatSalesCurrency(amount: number, currency: SalesGoalCurrency): string {
  const locale = currency === 'USD' ? 'en-US' : 'es-ES'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function sumValidatedSalesReports(reports: TeamSalesReport[]): number {
  return reports
    .filter((report) => report.status === 'validated')
    .reduce((total, report) => total + report.amount, 0)
}

export function buildSalesGoalProgress(
  goal: TeamSalesGoal,
  validatedAmount: number,
): SalesGoalProgress {
  const targetAmount = Math.max(goal.targetAmount, 0)
  const safeValidated = Math.max(validatedAmount, 0)
  const remainingAmount = Math.max(targetAmount - safeValidated, 0)
  const percentage =
    targetAmount > 0 ? Math.min(Math.round((safeValidated / targetAmount) * 100), 100) : 0

  let status: SalesGoalProgressStatus = 'in_progress'
  let statusLabel = 'En marcha'

  if (percentage >= 100) {
    status = 'achieved'
    statusLabel = 'Objetivo alcanzado'
  } else if (percentage >= 75) {
    status = 'near_goal'
    statusLabel = 'Cerca del objetivo'
  }

  return {
    targetAmount,
    validatedAmount: safeValidated,
    remainingAmount,
    percentage,
    status,
    statusLabel,
  }
}

export function isGoalForCurrentPeriod(goal: TeamSalesGoal, referenceDate = new Date()): boolean {
  const currentKey = buildSalesPeriodKey(goal.periodType, referenceDate).periodKey
  return goal.periodKey === currentKey
}

export const SALES_GOAL_COPY = {
  title: 'Objetivo de ventas',
  description:
    'Define una meta comercial clara y permite que el equipo vea cuánto falta para alcanzarla.',
  memberTitle: 'Objetivo de ventas del grupo',
  memberMotivation: 'Cada venta reportada ayuda al equipo a acercarse al objetivo.',
  configureButton: 'Configurar objetivo',
  viewReportsButton: 'Ver reportes',
  reportSaleButton: 'Reportar venta',
  validatePendingButton: 'Validar ventas pendientes',
  remaining: (amount: string) => `Faltan ${amount} para llegar al objetivo.`,
  achieved: 'Objetivo alcanzado 🎉',
  reportSuccess: 'Venta reportada. El líder podrá validarla.',
  reportError: 'No se pudo reportar la venta. Revisa el importe e inténtalo de nuevo.',
  noActiveGoalReport: 'No hay objetivo activo para reportar ventas.',
  goalSaved: 'Objetivo de ventas guardado.',
  validateSuccess: 'Venta validada.',
  rejectSuccess: 'Venta rechazada.',
  leaderEmpty: 'Configura un objetivo de ventas para enfocar al equipo.',
  memberEmpty:
    'Tu líder aún no ha configurado un objetivo de ventas para este periodo.',
  dashboardLeaderCta: 'Ver objetivo',
  dashboardMemberCta: 'Reportar venta',
  pendingSalesBadge: (count: number) =>
    `${count} venta${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} por validar`,
  reviewPendingSalesButton: 'Revisar ventas',
  pendingSalesLeaderNotice: 'Tienes ventas pendientes por validar.',
  commercialReportTitle: 'Reporte comercial del equipo',
  commercialReportDescription:
    'Visualiza quién está moviendo ventas, qué está pendiente y cómo avanza cada miembro.',
  commercialReportEmpty: 'Todavía no hay ventas reportadas por el equipo.',
  teamSalesProgressButton: 'Ver progreso de ventas del equipo',
  teamSalesProgressModalTitle: 'Progreso de ventas del equipo',
  teamSalesProgressModalDescription:
    'Consulta quién está moviendo ventas, cuánto ha validado y quién necesita acompañamiento.',
  memberCommercialProgressTitle: 'Progreso comercial',
  memberCommercialProgressDescription:
    'Avance comercial validado de este miembro dentro del objetivo del grupo.',
  memberCommercialProgressEmpty:
    'Este miembro aún no registra ventas validadas. Puede necesitar acompañamiento comercial.',
  memberCommercialPendingNotice: 'Hay ventas pendientes de validar.',
  memberCommercialTitle: 'Mi avance comercial',
  memberCommercialMotivation:
    'Tus ventas validadas ayudan al equipo a acercarse al objetivo.',
  dashboardMembersWithSales: (count: number) =>
    `${count} miembro${count === 1 ? '' : 's'} con ventas reportadas`,
  dashboardMemberValidatedProgress: (amount: string) => `Tu avance validado: ${amount}`,
  goToPlan: 'Ver Plan de Acción',
  modalConfigureTitle: 'Configurar objetivo de ventas',
  modalAdjustTitle: 'Ajustar objetivo de ventas',
  modalDescription:
    'Define la meta comercial del periodo. El equipo verá el avance con las ventas validadas.',
  modalPeriodHint: 'El objetivo aplica al periodo actual seleccionado.',
  modalPeriodAppliesTo: (label: string) => `Aplica a: ${label}`,
} as const

export function resolveDashboardSalesTeamContext(appUser: AppUser | null | undefined): {
  teamId: string | null
  isLeader: boolean
} {
  const leaderTeamId = resolveLeaderTeamId(appUser)
  const homeTeamId = appUser?.homeTeamId?.trim() || null
  const memberTeamId = homeTeamId && homeTeamId !== leaderTeamId ? homeTeamId : null

  if (leaderTeamId) {
    return { teamId: leaderTeamId, isLeader: true }
  }

  if (memberTeamId || homeTeamId) {
    return { teamId: memberTeamId || homeTeamId, isLeader: false }
  }

  return { teamId: null, isLeader: false }
}
