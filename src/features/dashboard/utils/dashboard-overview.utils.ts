import { Award, CalendarCheck, ClipboardList, Users } from 'lucide-react'
import { canAccessOwnerModules } from '@/features/access/utils/canAccessOwnerModules'
import { canSeeTeamProgressNav } from '@/features/access/utils/canAccessTeamProgress'
import { calculateContactKpis } from '@/features/contacts/utils/contactKpis'
import type { Contact } from '@/features/contacts/types/contact.types'
import type { ActionTask, ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { DashboardKpi } from '@/features/dashboard/types/dashboard.types'
import type {
  DashboardAttentionItem,
  DashboardCommercialGoalOverview,
  DashboardCommercialGoalStatus,
  DashboardOverviewData,
  DashboardPrizesOverview,
  DashboardQuickLink,
  DashboardRankingEntry,
  DashboardRankingOverview,
  DashboardRecentActivityItem,
  DashboardRewardsOverview,
  DashboardSalesOverview,
  DashboardSuggestionOverview,
  DashboardUserProfileOverview,
  DashboardWeeklyProgressOverview,
} from '@/features/dashboard/types/dashboard-overview.types'
import type { MemberDashboardProgress } from '@/features/member-dashboard/types/member-dashboard.types'
import type { RecognitionMonthlyPrizes } from '@/features/recognitions/types/recognition-monthly-prizes.types'
import type { RecognitionWeeklySnapshot } from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type { MonthlyMvpResult } from '@/features/recognitions/types/monthly-mvp.types'
import type { WeeklyRecognitionRanking } from '@/features/recognitions/types/recognition-ranking.types'
import type { ReferralPayoutRequest } from '@/features/referrals/types/referral-payout-request.types'
import type { ReferralRewardsDashboardStats } from '@/features/referrals/types/referral-rewards-dashboard.types'
import type { TeamSalesGoal, TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import { sumValidatedSalesReports } from '@/features/sales-goals/utils/salesGoalUtils'
import { formatDashboardCurrency } from '@/features/dashboard/utils/dashboardOverviewFormatters'
import {
  formatPayoutStatusLabel,
} from '@/features/dashboard/utils/dashboardOverviewMicrocopy'
import type { AppUser } from '@/types'
import type { Timestamp } from 'firebase/firestore'

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export function countTasksDueToday(
  tasks: ActionTask[],
  taskProgress: ActionTaskProgress[],
  referenceDate = new Date(),
): number {
  const progressByTaskId = new Map(taskProgress.map((progress) => [progress.taskId, progress]))

  return tasks.filter((task) => {
    if (!task.dueDate) {
      return false
    }

    const dueDate = new Date(task.dueDate)

    if (Number.isNaN(dueDate.getTime()) || !isSameCalendarDay(dueDate, referenceDate)) {
      return false
    }

    const status = progressByTaskId.get(task.id)?.status ?? 'pending'
    return status !== 'completed'
  }).length
}

export function buildDashboardUserProfile(
  appUser: AppUser | null | undefined,
  uid: string,
): DashboardUserProfileOverview {
  const ownedTeamId = appUser?.ownedTeamId?.trim() || null
  const hasActiveOwnedOrganization = Boolean(ownedTeamId) && canAccessOwnerModules(appUser)

  return {
    uid,
    displayName: appUser?.displayName?.trim() || 'Usuario',
    email: appUser?.email?.trim() || '',
    role: appUser?.role ?? 'user',
    activationStatus: appUser?.activationStatus,
    homeTeamId: appUser?.homeTeamId?.trim() || null,
    ownedTeamId,
    referralUpline: Array.isArray(appUser?.referralUpline) ? appUser.referralUpline : [],
    hasActiveOwnedOrganization,
  }
}

export function buildEmptyCommercialGoal(): DashboardCommercialGoalOverview {
  return {
    goalAmount: null,
    validatedAmount: 0,
    pendingAmount: 0,
    remainingAmount: null,
    progressPercent: null,
    periodKey: null,
    periodLabel: null,
    daysRemaining: null,
    status: 'no_goal',
    emptyMessage: 'Sin objetivo configurado',
    teamId: null,
    state: 'empty',
    errorMessage: null,
  }
}

function getDaysRemainingInMonth(referenceDate = new Date()): number {
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)
  const diffMs = end.getTime() - referenceDate.getTime()
  return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0)
}

function resolveCommercialGoalStatus(
  progressPercent: number,
  daysRemaining: number,
): DashboardCommercialGoalStatus {
  if (progressPercent >= 100) {
    return 'completed'
  }

  if (daysRemaining <= 7 && progressPercent < 75) {
    return 'at_risk'
  }

  if (progressPercent < 50) {
    return 'needs_attention'
  }

  return 'on_track'
}

export function buildCommercialGoalOverview(
  teamId: string | null,
  goal: TeamSalesGoal | null,
  reports: TeamSalesReport[],
): DashboardCommercialGoalOverview {
  if (!teamId || !goal) {
    return buildEmptyCommercialGoal()
  }

  const validatedAmount = sumValidatedSalesReports(reports)
  const pendingReports = reports.filter((report) => report.status === 'reported')
  const pendingAmount = pendingReports.reduce((sum, report) => sum + report.amount, 0)
  const goalAmount = Math.max(goal.targetAmount, 0)
  const remainingAmount = Math.max(goalAmount - validatedAmount, 0)
  const progressPercent =
    goalAmount > 0 ? Math.min(Math.round((validatedAmount / goalAmount) * 100), 100) : 0
  const daysRemaining = getDaysRemainingInMonth()

  return {
    goalAmount,
    validatedAmount,
    pendingAmount,
    remainingAmount,
    progressPercent,
    periodKey: goal.periodKey,
    periodLabel: goal.periodLabel,
    daysRemaining,
    status: resolveCommercialGoalStatus(progressPercent, daysRemaining),
    emptyMessage: null,
    teamId,
    state: 'ready',
    errorMessage: null,
  }
}

export function buildSalesOverview(reports: TeamSalesReport[]): DashboardSalesOverview {
  const validated = reports.filter((report) => report.status === 'validated')
  const pending = reports.filter((report) => report.status === 'reported')
  const rejected = reports.filter((report) => report.status === 'rejected')

  const latestPendingSales = [...pending]
    .sort((left, right) => {
      const leftTime = left.reportedAt?.toMillis?.() ?? 0
      const rightTime = right.reportedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
    .slice(0, 3)
    .map((report) => ({
      id: report.id,
      memberName: report.memberName,
      amount: report.amount,
      currency: report.currency,
      status: report.status,
      reportedAt: report.reportedAt,
    }))

  if (reports.length === 0) {
    return {
      validatedSalesCount: 0,
      validatedSalesAmount: 0,
      pendingSalesCount: 0,
      pendingSalesAmount: 0,
      rejectedSalesCount: 0,
      latestPendingSales: [],
      state: 'empty',
      emptyMessage: 'Sin ventas reportadas en este periodo',
      errorMessage: null,
    }
  }

  return {
    validatedSalesCount: validated.length,
    validatedSalesAmount: validated.reduce((sum, report) => sum + report.amount, 0),
    pendingSalesCount: pending.length,
    pendingSalesAmount: pending.reduce((sum, report) => sum + report.amount, 0),
    rejectedSalesCount: rejected.length,
    latestPendingSales,
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

function mapSnapshotEntries(
  snapshot: RecognitionWeeklySnapshot,
  limit: number,
): DashboardRankingEntry[] {
  const source =
    snapshot.podium.length > 0
      ? snapshot.podium
      : snapshot.ranking.map((entry) => ({
          memberUid: entry.memberUid,
          memberName: entry.memberName,
          score: entry.score,
          position: entry.position,
          summary: entry.summary,
        }))

  return source
    .filter((entry) => entry.score > 0)
    .sort((left, right) => left.position - right.position)
    .slice(0, limit)
    .map((entry) => ({
      rank: entry.position,
      memberUid: entry.memberUid,
      memberName: entry.memberName,
      points: entry.score,
      activitySummary: entry.summary || null,
    }))
}

function buildMonthlyTop5(
  monthlySnapshots: RecognitionWeeklySnapshot[],
): DashboardRankingEntry[] {
  const monthlyAccumulator = new Map<string, DashboardRankingEntry>()

  for (const snapshot of monthlySnapshots) {
    for (const entry of snapshot.ranking) {
      const existing = monthlyAccumulator.get(entry.memberUid)
      const nextPoints = (existing?.points ?? 0) + entry.score

      monthlyAccumulator.set(entry.memberUid, {
        rank: 0,
        memberUid: entry.memberUid,
        memberName: entry.memberName,
        points: nextPoints,
      })
    }
  }

  return [...monthlyAccumulator.values()]
    .filter((entry) => entry.points > 0)
    .sort((left, right) => right.points - left.points)
    .slice(0, 5)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

function buildEmptyRankingOverview(emptyMessage: string): DashboardRankingOverview {
  return {
    weeklyTop3: [],
    monthlyTop5: [],
    currentUserRank: null,
    currentUserPoints: null,
    pointsBreakdown: null,
    weekLabel: null,
    rankingSource: 'empty',
    state: 'empty',
    emptyMessage,
    errorMessage: null,
  }
}

export function buildRankingOverviewFromLiveRanking(
  liveRanking: WeeklyRecognitionRanking,
  viewerUid: string,
): DashboardRankingOverview {
  const source =
    liveRanking.podium.length > 0
      ? liveRanking.podium
      : liveRanking.entries.filter((entry) => entry.breakdown.total > 0)

  const weeklyTop3 = source
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 3)
    .map((entry) => ({
      rank: entry.rank,
      memberUid: entry.memberUid,
      memberName: entry.memberName,
      points: entry.breakdown.total,
      activitySummary: entry.activitySummary || null,
    }))

  const viewerEntry = liveRanking.entries.find((entry) => entry.memberUid === viewerUid)

  return {
    weeklyTop3,
    monthlyTop5: weeklyTop3,
    currentUserRank: viewerEntry?.rank ?? null,
    currentUserPoints: viewerEntry?.breakdown.total ?? null,
    pointsBreakdown: viewerEntry
      ? {
          academyPoints: viewerEntry.breakdown.academyPoints,
          taskPoints: viewerEntry.breakdown.taskPoints,
          reminderPoints: viewerEntry.breakdown.reminderPoints,
          bonusPoints: viewerEntry.breakdown.bonusPoints,
          salesPoints: viewerEntry.breakdown.salesPoints,
        }
      : null,
    weekLabel: liveRanking.period.label,
    rankingSource: 'live_weekly',
    state: weeklyTop3.length > 0 ? 'ready' : 'empty',
    emptyMessage: weeklyTop3.length > 0 ? null : 'Aún no hay puntos en la semana actual',
    errorMessage: null,
  }
}

function buildRankingOverviewFromPublishedSnapshot(
  weeklySnapshot: RecognitionWeeklySnapshot,
  monthlyTop5: DashboardRankingEntry[],
  viewerUid: string,
): DashboardRankingOverview {
  const weeklyTop3 = mapSnapshotEntries(weeklySnapshot, 3)
  const currentRankingEntry =
    weeklySnapshot.ranking.find((entry) => entry.memberUid === viewerUid) ??
    weeklySnapshot.podium.find((entry) => entry.memberUid === viewerUid)
  const breakdownEntry = weeklySnapshot.ranking.find((entry) => entry.memberUid === viewerUid)

  return {
    weeklyTop3,
    monthlyTop5,
    currentUserRank: currentRankingEntry?.position ?? null,
    currentUserPoints: currentRankingEntry?.score ?? null,
    pointsBreakdown: breakdownEntry
      ? {
          academyPoints: breakdownEntry.breakdownPublic.academyPoints,
          taskPoints: breakdownEntry.breakdownPublic.taskPoints,
          reminderPoints: breakdownEntry.breakdownPublic.reminderPoints,
          bonusPoints: breakdownEntry.breakdownPublic.bonusPoints,
          salesPoints: breakdownEntry.breakdownPublic.salesPoints,
        }
      : null,
    weekLabel: weeklySnapshot.weekLabel,
    rankingSource: 'published_weekly',
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

function buildRankingOverviewFromMonthlyAggregate(
  monthlyTop5: DashboardRankingEntry[],
): DashboardRankingOverview {
  return {
    weeklyTop3: monthlyTop5.slice(0, 3),
    monthlyTop5,
    currentUserRank: null,
    currentUserPoints: null,
    pointsBreakdown: null,
    weekLabel: null,
    rankingSource: 'monthly_aggregate',
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

export function buildRankingOverview(
  weeklySnapshot: RecognitionWeeklySnapshot | null,
  monthlySnapshots: RecognitionWeeklySnapshot[],
  viewerUid: string,
  liveRanking: WeeklyRecognitionRanking | null = null,
): DashboardRankingOverview {
  const monthlyTop5 = buildMonthlyTop5(monthlySnapshots)

  if (weeklySnapshot) {
    const publishedTop3 = mapSnapshotEntries(weeklySnapshot, 3)

    if (publishedTop3.length > 0) {
      return buildRankingOverviewFromPublishedSnapshot(weeklySnapshot, monthlyTop5, viewerUid)
    }
  }

  if (liveRanking?.hasActivity) {
    const liveOverview = buildRankingOverviewFromLiveRanking(liveRanking, viewerUid)

    if (liveOverview.weeklyTop3.length > 0) {
      return {
        ...liveOverview,
        monthlyTop5,
      }
    }
  }

  if (monthlyTop5.length > 0) {
    return buildRankingOverviewFromMonthlyAggregate(monthlyTop5)
  }

  return buildEmptyRankingOverview('Aún no hay ranking publicado')
}

function isRealMemberDisplayName(name: string | null | undefined): name is string {
  if (!name?.trim()) {
    return false
  }

  const normalized = name.trim().toLowerCase()
  return normalized !== 'miembro' && normalized !== 'miembro del equipo'
}

function resolveMvpCandidateName(monthlyMvp: MonthlyMvpResult | null): string | null {
  const candidateName = monthlyMvp?.winner?.memberName ?? monthlyMvp?.candidates[0]?.memberName ?? null
  return isRealMemberDisplayName(candidateName) ? candidateName : null
}

export function buildPrizesOverview(
  prizes: RecognitionMonthlyPrizes | null,
  monthlyMvp: MonthlyMvpResult | null,
): DashboardPrizesOverview {
  if (!prizes) {
    return {
      mvpPrize: null,
      secondPrize: null,
      thirdPrize: null,
      currentMvpCandidate: null,
      prizePeriod: monthlyMvp?.monthLabel ?? null,
      isConfigured: false,
      state: 'empty',
      emptyMessage: 'Premios no configurados',
      errorMessage: null,
    }
  }

  return {
    mvpPrize: prizes.firstPrize || null,
    secondPrize: prizes.secondPrize || null,
    thirdPrize: prizes.thirdPrize || null,
    currentMvpCandidate: resolveMvpCandidateName(monthlyMvp),
    prizePeriod: monthlyMvp?.monthLabel ?? null,
    isConfigured: true,
    state: 'ready',
    emptyMessage: null,
    errorMessage: null,
  }
}

export function buildRewardsOverview(
  stats: ReferralRewardsDashboardStats,
  payoutRequests: ReferralPayoutRequest[],
): DashboardRewardsOverview {
  const pendingPayouts = payoutRequests.filter(
    (request) => request.status === 'pending' || request.status === 'approved',
  )

  return {
    rewardsPayableAmount: stats.payableAmount,
    rewardsRequestedAmount: stats.requestedAmount,
    rewardsPaidAmount: stats.paidAmount,
    rewardsCancelledAmount: stats.cancelledAmount,
    payoutPendingCount: pendingPayouts.length,
    latestPayoutRequest: payoutRequests[0] ?? null,
    state: stats.totalCount > 0 || payoutRequests.length > 0 ? 'ready' : 'empty',
    emptyMessage:
      stats.totalCount > 0 || payoutRequests.length > 0
        ? null
        : 'Sin recompensas ni solicitudes de pago',
    errorMessage: null,
  }
}

export function buildDashboardKpisFromOverview(input: {
  contacts: Contact[]
  tasksDueTodayCount: number
  planProgressPercent: number | null
  hasPlanTasks: boolean
}): DashboardKpi[] {
  const { total, following } = calculateContactKpis(input.contacts)

  const taskKpi: DashboardKpi = {
    label: 'Tareas de hoy',
    value: String(input.tasksDueTodayCount),
    detail:
      input.tasksDueTodayCount === 1
        ? 'Pendiente para hoy'
        : 'Pendientes para hoy',
    trend: 'neutral',
    icon: CalendarCheck,
    source: 'live',
  }

  const planKpi: DashboardKpi = {
    label: 'Avance del plan',
    value: input.hasPlanTasks && input.planProgressPercent !== null ? `${input.planProgressPercent}%` : '—',
    detail:
      input.hasPlanTasks && input.planProgressPercent !== null
        ? 'Tareas completadas del equipo'
        : 'Sin tareas asignadas',
    trend: 'neutral',
    icon: Award,
    showProgressRing: input.hasPlanTasks && input.planProgressPercent !== null,
    source: 'live',
  }

  return [
    {
      label: 'Personas interesadas',
      value: String(total),
      detail: 'Contactos registrados',
      trend: 'neutral',
      icon: Users,
      source: 'live',
    },
    {
      label: 'Seguimientos',
      value: String(following),
      detail: 'En seguimiento activo',
      trend: 'neutral',
      icon: ClipboardList,
      source: 'live',
    },
    taskKpi,
    planKpi,
  ]
}

export function buildWeeklyProgressOverview(
  memberProgress: MemberDashboardProgress | null,
  ranking: DashboardRankingOverview,
): DashboardWeeklyProgressOverview {
  if (memberProgress && memberProgress.plan.totalTasks > 0) {
    const value = Math.round(
      (memberProgress.plan.completedTasksCount / memberProgress.plan.totalTasks) * 100,
    )

    return {
      isAvailable: true,
      value,
      goal: 100,
      message: memberProgress.nextStep.message,
      emptyMessage: null,
    }
  }

  if (ranking.currentUserPoints !== null) {
    return {
      isAvailable: true,
      value: ranking.currentUserPoints,
      goal: ranking.weeklyTop3[0]?.points ?? ranking.currentUserPoints,
      message: ranking.weekLabel
        ? `Puntos publicados en ${ranking.weekLabel}`
        : 'Puntos del ranking semanal publicado',
      emptyMessage: null,
    }
  }

  return {
    isAvailable: false,
    value: 0,
    goal: 100,
    message: '',
    emptyMessage: 'Aún no hay avance semanal disponible',
  }
}

export function buildSuggestionOverview(
  memberProgress: MemberDashboardProgress | null,
): DashboardSuggestionOverview {
  if (!memberProgress?.nextStep) {
    return {
      title: 'Próximo paso',
      message: 'Cuando tengas actividad en tu grupo, verás aquí tu siguiente acción recomendada.',
      actionLabel: 'Ver mi grupo',
      actionTo: '/dashboard/mi-grupo',
      isAvailable: false,
    }
  }

  return {
    title: 'Próximo paso',
    message: memberProgress.nextStep.message,
    actionLabel: memberProgress.nextStep.ctaLabel,
    actionTo: memberProgress.nextStep.ctaTo,
    isAvailable: true,
  }
}

export function buildAttentionItems(input: {
  sales: DashboardSalesOverview
  contacts: Contact[]
  memberProgress: MemberDashboardProgress | null
  inactiveMembersCount: number
  adminPendingPayoutsCount: number
  isAdmin: boolean
  hasOwnedTeam: boolean
}): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = []
  const contactKpis = calculateContactKpis(input.contacts)
  const hotContactsCount = contactKpis.new + contactKpis.following
  const pendingTasksCount = input.memberProgress?.plan.pendingTasksCount ?? 0
  const unreadRemindersCount = input.memberProgress?.unreadRemindersCount ?? 0

  if (input.hasOwnedTeam && input.sales.pendingSalesCount > 0) {
    items.push({
      id: 'pending-sales',
      type: 'pending_sales',
      title: 'Ventas por validar',
      description: 'Hay ventas reportadas esperando tu revisión.',
      count: input.sales.pendingSalesCount,
      priority: 'high',
      href: '/dashboard/progreso-equipo',
      isVisible: true,
    })
  }

  if (input.isAdmin && input.adminPendingPayoutsCount > 0) {
    items.push({
      id: 'pending-payouts',
      type: 'pending_payouts',
      title: 'Pagos por gestionar',
      description: 'Hay solicitudes de pago pendientes de aprobación o liquidación.',
      count: input.adminPendingPayoutsCount,
      priority: 'high',
      href: '/admin/pagos',
      isVisible: true,
    })
  }

  if (input.hasOwnedTeam && input.inactiveMembersCount > 0) {
    items.push({
      id: 'inactive-members',
      type: 'inactive_members',
      title: 'Miembros sin activar',
      description: 'Miembros directos que aún no activaron su organización.',
      count: input.inactiveMembersCount,
      priority: 'medium',
      href: '/dashboard/mi-grupo',
      isVisible: true,
    })
  }

  if (hotContactsCount > 0) {
    items.push({
      id: 'hot-contacts',
      type: 'hot_contacts',
      title: 'Contactos activos',
      description: 'Personas nuevas o en seguimiento que requieren atención.',
      count: hotContactsCount,
      priority: 'medium',
      href: '/dashboard/contactos',
      isVisible: true,
    })
  }

  if (pendingTasksCount > 0) {
    items.push({
      id: 'pending-tasks',
      type: 'pending_tasks',
      title: 'Tareas pendientes',
      description: 'Tareas del plan de acción sin completar.',
      count: pendingTasksCount,
      priority: 'medium',
      href: '/dashboard/plan',
      isVisible: true,
    })
  }

  if (unreadRemindersCount > 0) {
    items.push({
      id: 'unread-reminders',
      type: 'unread_reminders',
      title: 'Recordatorios sin leer',
      description: 'Mensajes del grupo que aún no has revisado.',
      count: unreadRemindersCount,
      priority: 'high',
      href: '/dashboard#member-reminders',
      isVisible: true,
    })
  }

  return items.filter((item) => item.isVisible && item.count > 0)
}

function getTimestampMillis(timestamp: Timestamp | null | undefined): number {
  return timestamp?.toMillis?.() ?? 0
}

export function buildRecentActivity(input: {
  salesReports: TeamSalesReport[]
  payoutRequests: ReferralPayoutRequest[]
  contacts: Contact[]
  memberProgress: MemberDashboardProgress | null
}): DashboardRecentActivityItem[] {
  const events: DashboardRecentActivityItem[] = []

  for (const report of input.salesReports.slice(0, 12)) {
    const isValidated = report.status === 'validated'
    const amountLabel = formatDashboardCurrency(report.amount, report.currency)

    events.push({
      id: `sale-${report.id}`,
      type: isValidated ? 'sale_validated' : 'sale_reported',
      title: isValidated ? 'Venta validada' : 'Venta reportada',
      description: isValidated
        ? `${report.memberName} aportó ${amountLabel} al objetivo del grupo.`
        : `${report.memberName} reportó una venta de ${amountLabel}.`,
      createdAt: report.validatedAt ?? report.reportedAt,
      actorName: report.memberName,
      href: '/dashboard/progreso-equipo',
    })
  }

  for (const request of input.payoutRequests.slice(0, 3)) {
    const amountLabel = formatDashboardCurrency(request.amount, request.currency)
    const statusLabel = formatPayoutStatusLabel(request.status)
    const isPaid = request.status === 'paid'
    const isRejected = request.status === 'rejected'

    events.push({
      id: `payout-${request.requestId}`,
      type: 'payout_requested',
      title: isPaid ? 'Pago completado' : isRejected ? 'Pago rechazado' : 'Solicitud de pago',
      description: isPaid
        ? `Se marcó como pagada una solicitud de ${amountLabel}.`
        : isRejected
          ? `Una solicitud de ${amountLabel} fue rechazada.`
          : `Solicitud de ${amountLabel} ${statusLabel}.`,
      createdAt: request.requestedAt,
      actorName: null,
      href: '/dashboard/recompensas',
    })
  }

  for (const contact of input.contacts.slice(0, 5)) {
    events.push({
      id: `contact-${contact.id}`,
      type: 'contact_created',
      title: 'Nuevo contacto',
      description: `${contact.name} se añadió a tu red.`,
      createdAt: contact.createdAt ?? null,
      actorName: contact.name,
      href: '/dashboard/contactos',
    })
  }

  if (input.memberProgress?.lastReminderTitle) {
    const latestReminder = input.memberProgress.reminders[0]

    if (latestReminder) {
      events.push({
        id: `reminder-${latestReminder.id}`,
        type: 'reminder_received',
        title: 'Recordatorio del grupo',
        description: latestReminder.title,
        createdAt: latestReminder.createdAt,
        actorName: null,
        href: '/dashboard#member-reminders',
      })
    }
  }

  return events
    .sort((left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt))
    .slice(0, 8)
}

export function buildDashboardQuickLinks(appUser: AppUser | null | undefined): DashboardQuickLink[] {
  const hasOwnerAccess = canAccessOwnerModules(appUser)
  const canSeeTeamProgress = canSeeTeamProgressNav(appUser)

  return [
    {
      label: 'Presentación',
      href: '/dashboard/presentacion',
      description: 'Configura tu landing de marca personal',
      isEnabled: hasOwnerAccess,
      reasonIfDisabled: 'Activa tu organización para acceder',
    },
    {
      label: 'Radar de Interés',
      href: '/dashboard/radar',
      description: 'Explora señales de interés en tu red',
      isEnabled: hasOwnerAccess,
      reasonIfDisabled: 'Activa tu organización para acceder',
    },
    {
      label: 'Contactos',
      href: '/dashboard/contactos',
      description: 'Gestiona personas interesadas',
      isEnabled: hasOwnerAccess,
      reasonIfDisabled: 'Activa tu organización para acceder',
    },
    {
      label: 'Academia',
      href: '/dashboard/academia',
      description: 'Continúa tu formación',
      isEnabled: true,
    },
    {
      label: 'Plan de Acción',
      href: '/dashboard/plan',
      description: 'Avanza en las tareas del equipo',
      isEnabled: true,
    },
    {
      label: 'Reconocimientos',
      href: '/dashboard/reconocimientos',
      description: 'Consulta ranking y premios',
      isEnabled: true,
    },
    {
      label: 'Progreso de Equipo',
      href: '/dashboard/progreso-equipo',
      description: 'Revisa el avance de tu organización',
      isEnabled: canSeeTeamProgress,
      reasonIfDisabled: 'Disponible con organización activa',
    },
    {
      label: 'Recompensas',
      href: '/dashboard/recompensas',
      description: 'Consulta recompensas y pagos',
      isEnabled: true,
    },
  ]
}

export function createEmptyDashboardOverview(
  appUser: AppUser | null | undefined,
  uid: string,
): DashboardOverviewData {
  const userProfile = buildDashboardUserProfile(appUser, uid)

  return {
    userProfile,
    homeTeam: null,
    ownedTeam: null,
    scopes: {
      home_team: null,
      owned_team: null,
    },
    commercialGoal: buildEmptyCommercialGoal(),
    sales: buildSalesOverview([]),
    ranking: buildRankingOverview(null, [], uid),
    prizes: buildPrizesOverview(null, null),
    rewards: buildRewardsOverview(
      {
        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        payableAmount: 0,
        requestedAmount: 0,
        paidAmount: 0,
        cancelledAmount: 0,
        totalCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        payableCount: 0,
        requestedCount: 0,
        paidCount: 0,
        cancelledCount: 0,
        levelStats: [],
      },
      [],
    ),
    attentionItems: [],
    recentActivity: [],
    quickLinks: buildDashboardQuickLinks(appUser),
    kpis: buildDashboardKpisFromOverview({
      contacts: [],
      tasksDueTodayCount: 0,
      planProgressPercent: null,
      hasPlanTasks: false,
    }),
    weeklyProgress: buildWeeklyProgressOverview(null, buildRankingOverview(null, [], uid)),
    suggestion: buildSuggestionOverview(null),
  }
}
