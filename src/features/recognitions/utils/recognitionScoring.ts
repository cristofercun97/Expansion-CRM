import type { TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import { formatSalesCurrency } from '@/features/sales-goals/utils/salesGoalUtils'
import type { AcademyMaterialEngagement } from '@/features/academy/types/academy-material-engagement.types'
import type { AcademyTestAttempt } from '@/features/academy/types/academy-test-attempt.types'
import type { ActionTaskProgress } from '@/features/action-plan/types/action-plan.types'
import type { TeamMember } from '@/features/team/types/team.types'
import type { TeamReminder } from '@/features/reminders/types/reminder.types'
import type {
  PublishRecognitionWeeklySnapshotInput,
  RecognitionWeeklySnapshot,
} from '@/features/recognitions/types/recognition-weekly-snapshot.types'
import type {
  MemberWeeklyActivityStats,
  RecognitionRankingRawData,
  RecognitionWeekPeriod,
  WeeklyRankingEntry,
  WeeklyRecognitionRanking,
  WeeklyScoreBreakdown,
} from '@/features/recognitions/types/recognition-ranking.types'
import type { Timestamp } from 'firebase/firestore'
import { buildRecognitionWeekKey } from '@/features/recognitions/utils/recognitionWeeklySnapshotUtils'

const SALES_RECOGNITION_POINTS = {
  perValidatedSale: 60,
  amountPerPoint: 25,
  bonus500: 50,
  bonus1000: 100,
  bonus500Threshold: 500,
  bonus1000Threshold: 1000,
} as const

const POINTS = {
  moduleReviewed: 10,
  testAttempt: 15,
  highScoreBonus: 10,
  highScoreThreshold: 80,
  taskCompleted: 20,
  taskInProgress: 8,
  reminderRead: 5,
} as const

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

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatPeriodLabel(weekStart: Date, weekEnd: Date): string {
  const startLabel = weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  const endLabel = weekEnd.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return `${startLabel} – ${endLabel}`
}

/** Semana calendario lunes–domingo (helper preparado para v2). */
export function getCalendarWeekPeriod(referenceDate = new Date()): RecognitionWeekPeriod {
  const reference = startOfDay(referenceDate)
  const day = reference.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const weekStart = new Date(reference)
  weekStart.setDate(reference.getDate() + mondayOffset)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return buildRecognitionWeekPeriod(startOfDay(weekStart), endOfDay(weekEnd))
}

/** v1: últimos 7 días incluyendo hoy. */
export function getCurrentRecognitionWeekPeriod(referenceDate = new Date()): RecognitionWeekPeriod {
  const weekEnd = endOfDay(referenceDate)
  const weekStart = startOfDay(new Date(weekEnd))
  weekStart.setDate(weekStart.getDate() - 6)

  return buildRecognitionWeekPeriod(weekStart, weekEnd)
}

function buildRecognitionWeekPeriod(
  weekStart: Date,
  weekEnd: Date,
): RecognitionWeekPeriod {
  return {
    weekStart,
    weekEnd,
    weekStartIso: formatIsoDate(weekStart),
    weekEndIso: formatIsoDate(weekEnd),
    label: formatPeriodLabel(weekStart, weekEnd),
    startMs: weekStart.getTime(),
    endMs: weekEnd.getTime(),
  }
}

export function isTimestampInRecognitionPeriod(
  timestamp: Timestamp | null | undefined,
  period: RecognitionWeekPeriod,
): boolean {
  const millis = timestamp?.toMillis?.()

  if (typeof millis !== 'number') {
    return false
  }

  return millis >= period.startMs && millis <= period.endMs
}

function resolveMemberName(member: TeamMember): string {
  const name = member.memberName?.trim()

  if (name) {
    return name
  }

  const email = member.memberEmail?.trim()

  if (email) {
    return email.split('@')[0] ?? email
  }

  return 'Miembro'
}

function createEmptyBreakdown(): WeeklyScoreBreakdown {
  return {
    academyPoints: 0,
    taskPoints: 0,
    reminderPoints: 0,
    bonusPoints: 0,
    salesPoints: 0,
    validatedSalesAmount: 0,
    validatedSalesCount: 0,
    salesBonusPoints: 0,
    total: 0,
  }
}

function createEmptyStats(): MemberWeeklyActivityStats {
  return {
    modulesReviewed: 0,
    testsTaken: 0,
    tasksCompleted: 0,
    tasksInProgress: 0,
    remindersRead: 0,
    validatedSalesCount: 0,
  }
}

export function calculateSalesRecognitionPoints(reports: TeamSalesReport[]): {
  salesPoints: number
  validatedSalesAmount: number
  validatedSalesCount: number
  salesBonusPoints: number
} {
  const validatedReports = reports.filter((report) => report.status === 'validated')
  const validatedSalesCount = validatedReports.length
  const validatedSalesAmount = validatedReports.reduce(
    (total, report) => total + report.amount,
    0,
  )
  const basePoints = validatedSalesCount * SALES_RECOGNITION_POINTS.perValidatedSale
  const amountPoints = Math.floor(validatedSalesAmount / SALES_RECOGNITION_POINTS.amountPerPoint)
  const bonus500 =
    validatedSalesAmount >= SALES_RECOGNITION_POINTS.bonus500Threshold
      ? SALES_RECOGNITION_POINTS.bonus500
      : 0
  const bonus1000 =
    validatedSalesAmount >= SALES_RECOGNITION_POINTS.bonus1000Threshold
      ? SALES_RECOGNITION_POINTS.bonus1000
      : 0
  const salesBonusPoints = bonus500 + bonus1000
  const salesPoints = basePoints + amountPoints + salesBonusPoints

  return {
    salesPoints,
    validatedSalesAmount,
    validatedSalesCount,
    salesBonusPoints,
  }
}

export function buildSalesRecognitionSummary(
  breakdown: Pick<WeeklyScoreBreakdown, 'validatedSalesCount' | 'validatedSalesAmount'>,
  currency: 'EUR' | 'USD' = 'EUR',
): string | null {
  if (!breakdown.validatedSalesCount || breakdown.validatedSalesCount <= 0) {
    return null
  }

  return `Validó ${breakdown.validatedSalesCount} venta${breakdown.validatedSalesCount === 1 ? '' : 's'} · ${formatSalesCurrency(breakdown.validatedSalesAmount, currency)} aportados`
}

function filterMemberValidatedReportsInPeriod(
  memberUid: string,
  salesReports: TeamSalesReport[],
  period: RecognitionWeekPeriod,
): TeamSalesReport[] {
  return salesReports.filter((report) => {
    if (report.memberUid !== memberUid || report.status !== 'validated') {
      return false
    }

    const timestamp = report.validatedAt ?? report.updatedAt
    return isTimestampInRecognitionPeriod(timestamp, period)
  })
}

function scoreSalesForMember(
  memberUid: string,
  salesReports: TeamSalesReport[],
  period: RecognitionWeekPeriod,
  breakdown: WeeklyScoreBreakdown,
  stats: MemberWeeklyActivityStats,
): void {
  const memberValidatedReports = filterMemberValidatedReportsInPeriod(
    memberUid,
    salesReports,
    period,
  )
  const sales = calculateSalesRecognitionPoints(memberValidatedReports)

  breakdown.salesPoints = sales.salesPoints
  breakdown.validatedSalesAmount = sales.validatedSalesAmount
  breakdown.validatedSalesCount = sales.validatedSalesCount
  breakdown.salesBonusPoints = sales.salesBonusPoints
  breakdown.total += sales.salesPoints
  stats.validatedSalesCount = sales.validatedSalesCount
}

function buildActivitySummary(stats: MemberWeeklyActivityStats): string {
  const parts: string[] = []

  if (stats.tasksCompleted > 0) {
    parts.push(
      `Completó ${stats.tasksCompleted} tarea${stats.tasksCompleted === 1 ? '' : 's'}`,
    )
  }

  if (stats.modulesReviewed > 0) {
    parts.push(
      `Revisó ${stats.modulesReviewed} módulo${stats.modulesReviewed === 1 ? '' : 's'}`,
    )
  }

  if (stats.testsTaken > 0) {
    parts.push(`Realizó ${stats.testsTaken} test${stats.testsTaken === 1 ? '' : 's'}`)
  }

  if (stats.remindersRead > 0) {
    parts.push(
      `Leyó ${stats.remindersRead} recordatorio${stats.remindersRead === 1 ? '' : 's'}`,
    )
  }

  if (stats.validatedSalesCount > 0) {
    parts.push(
      `Validó ${stats.validatedSalesCount} venta${stats.validatedSalesCount === 1 ? '' : 's'}`,
    )
  }

  if (parts.length === 0) {
    return 'Aún sin actividad registrada esta semana'
  }

  return parts.join(' · ')
}

function scoreEngagementsForMember(
  memberUid: string,
  engagements: AcademyMaterialEngagement[],
  period: RecognitionWeekPeriod,
  breakdown: WeeklyScoreBreakdown,
  stats: MemberWeeklyActivityStats,
): void {
  for (const engagement of engagements) {
    if (engagement.memberUid !== memberUid) {
      continue
    }

    const reviewedThisWeek =
      isTimestampInRecognitionPeriod(engagement.lastOpenedAt, period) ||
      isTimestampInRecognitionPeriod(engagement.updatedAt, period) ||
      isTimestampInRecognitionPeriod(engagement.openedAt, period)

    if (!reviewedThisWeek) {
      continue
    }

    stats.modulesReviewed += 1
    breakdown.academyPoints += POINTS.moduleReviewed
    breakdown.total += POINTS.moduleReviewed
  }
}

function scoreAttemptsForMember(
  memberUid: string,
  attempts: AcademyTestAttempt[],
  period: RecognitionWeekPeriod,
  breakdown: WeeklyScoreBreakdown,
  stats: MemberWeeklyActivityStats,
): void {
  for (const attempt of attempts) {
    if (attempt.memberUid !== memberUid) {
      continue
    }

    const attemptedThisWeek =
      isTimestampInRecognitionPeriod(attempt.submittedAt, period) ||
      isTimestampInRecognitionPeriod(attempt.createdAt, period)

    if (!attemptedThisWeek) {
      continue
    }

    stats.testsTaken += 1
    breakdown.academyPoints += POINTS.testAttempt
    breakdown.total += POINTS.testAttempt

    if (attempt.score >= POINTS.highScoreThreshold) {
      breakdown.bonusPoints += POINTS.highScoreBonus
      breakdown.total += POINTS.highScoreBonus
    }
  }
}

function scoreTaskProgressForMember(
  memberUid: string,
  taskProgress: ActionTaskProgress[],
  period: RecognitionWeekPeriod,
  breakdown: WeeklyScoreBreakdown,
  stats: MemberWeeklyActivityStats,
): void {
  for (const progress of taskProgress) {
    if (progress.memberUid !== memberUid) {
      continue
    }

    const activityTimestamp = progress.updatedAt ?? progress.createdAt
    const activeThisWeek = isTimestampInRecognitionPeriod(activityTimestamp, period)

    if (!activeThisWeek) {
      continue
    }

    if (progress.status === 'completed') {
      stats.tasksCompleted += 1
      breakdown.taskPoints += POINTS.taskCompleted
      breakdown.total += POINTS.taskCompleted
      continue
    }

    if (progress.status === 'in_progress') {
      stats.tasksInProgress += 1
      breakdown.taskPoints += POINTS.taskInProgress
      breakdown.total += POINTS.taskInProgress
    }
  }
}

function scoreRemindersForMember(
  memberUid: string,
  reminders: TeamReminder[],
  period: RecognitionWeekPeriod,
  breakdown: WeeklyScoreBreakdown,
  stats: MemberWeeklyActivityStats,
): void {
  for (const reminder of reminders) {
    if (reminder.recipientUid !== memberUid || reminder.status !== 'read') {
      continue
    }

    if (!isTimestampInRecognitionPeriod(reminder.readAt, period)) {
      continue
    }

    stats.remindersRead += 1
    breakdown.reminderPoints += POINTS.reminderRead
    breakdown.total += POINTS.reminderRead
  }
}

function scoreMemberWeeklyActivity(
  member: TeamMember,
  data: RecognitionRankingRawData,
  period: RecognitionWeekPeriod,
): WeeklyRankingEntry {
  const breakdown = createEmptyBreakdown()
  const stats = createEmptyStats()

  scoreEngagementsForMember(member.memberUid, data.engagements, period, breakdown, stats)
  scoreAttemptsForMember(member.memberUid, data.attempts, period, breakdown, stats)
  scoreTaskProgressForMember(member.memberUid, data.taskProgress, period, breakdown, stats)
  scoreRemindersForMember(member.memberUid, data.reminders, period, breakdown, stats)
  scoreSalesForMember(member.memberUid, data.salesReports, period, breakdown, stats)

  return {
    rank: 0,
    memberUid: member.memberUid,
    memberName: resolveMemberName(member),
    breakdown,
    stats,
    activitySummary: buildActivitySummary(stats),
  }
}

export function buildWeeklyRecognitionRanking(
  data: RecognitionRankingRawData,
  period: RecognitionWeekPeriod = getCurrentRecognitionWeekPeriod(),
): WeeklyRecognitionRanking {
  const activeMembers = data.members.filter((member) => member.status === 'active')

  const sortedEntries = activeMembers
    .map((member) => scoreMemberWeeklyActivity(member, data, period))
    .sort((left, right) => {
      if (right.breakdown.total !== left.breakdown.total) {
        return right.breakdown.total - left.breakdown.total
      }

      return left.memberName.localeCompare(right.memberName, 'es')
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  const membersWithPointsCount = sortedEntries.filter(
    (entry) => entry.breakdown.total > 0,
  ).length

  return {
    teamId: data.teamId,
    period,
    entries: sortedEntries,
    podium: sortedEntries.slice(0, 3),
    membersWithPointsCount,
    hasActivity: membersWithPointsCount > 0,
    loadWarnings: data.loadWarnings,
  }
}

export function getRecognitionMomentumMessage(membersWithPointsCount: number): string {
  if (membersWithPointsCount === 0) {
    return 'El podio está abierto. Completa una acción para empezar a sumar.'
  }

  if (membersWithPointsCount === 1) {
    return '1 miembro ya empezó a sumar puntos esta semana. El podio aún está abierto.'
  }

  if (membersWithPointsCount >= 3) {
    return `${membersWithPointsCount} miembros ya sumaron puntos esta semana.`
  }

  return `${membersWithPointsCount} miembros ya sumaron puntos esta semana.`
}

export function buildPersonalWeeklyRankingEntry(
  member: TeamMember,
  data: RecognitionRankingRawData,
  period: RecognitionWeekPeriod = getCurrentRecognitionWeekPeriod(),
): WeeklyRankingEntry {
  return scoreMemberWeeklyActivity(member, data, period)
}

export function weeklyRecognitionRankingToSnapshotInput(
  ranking: WeeklyRecognitionRanking,
  generatedByUid: string,
): PublishRecognitionWeeklySnapshotInput {
  return {
    teamId: ranking.teamId,
    weekKey: buildRecognitionWeekKey(ranking.period),
    weekLabel: ranking.period.label,
    weekStartDate: ranking.period.weekStartIso,
    weekEndDate: ranking.period.weekEndIso,
    generatedByUid,
    podium: ranking.podium.map((entry) => ({
      memberUid: entry.memberUid,
      memberName: entry.memberName,
      score: entry.breakdown.total,
      position: entry.rank,
      summary: entry.activitySummary,
    })),
    ranking: ranking.entries.map((entry) => ({
      memberUid: entry.memberUid,
      memberName: entry.memberName,
      score: entry.breakdown.total,
      position: entry.rank,
      summary: entry.activitySummary,
      breakdownPublic: {
        academyPoints: entry.breakdown.academyPoints,
        taskPoints: entry.breakdown.taskPoints,
        reminderPoints: entry.breakdown.reminderPoints,
        bonusPoints: entry.breakdown.bonusPoints,
        salesPoints: entry.breakdown.salesPoints,
        validatedSalesAmount: entry.breakdown.validatedSalesAmount,
        validatedSalesCount: entry.breakdown.validatedSalesCount,
        salesBonusPoints: entry.breakdown.salesBonusPoints,
      },
    })),
  }
}

export function snapshotToWeeklyRecognitionRanking(
  snapshot: RecognitionWeeklySnapshot,
): WeeklyRecognitionRanking {
  const period: RecognitionWeekPeriod = {
    weekStart: new Date(`${snapshot.weekStartDate}T00:00:00`),
    weekEnd: new Date(`${snapshot.weekEndDate}T23:59:59`),
    weekStartIso: snapshot.weekStartDate,
    weekEndIso: snapshot.weekEndDate,
    label: snapshot.weekLabel,
    startMs: new Date(`${snapshot.weekStartDate}T00:00:00`).getTime(),
    endMs: new Date(`${snapshot.weekEndDate}T23:59:59`).getTime(),
  }

  const entries: WeeklyRankingEntry[] = snapshot.ranking.map((entry) => ({
    rank: entry.position,
    memberUid: entry.memberUid,
    memberName: entry.memberName,
    breakdown: {
      academyPoints: entry.breakdownPublic.academyPoints,
      taskPoints: entry.breakdownPublic.taskPoints,
      reminderPoints: entry.breakdownPublic.reminderPoints,
      bonusPoints: entry.breakdownPublic.bonusPoints,
      salesPoints: entry.breakdownPublic.salesPoints ?? 0,
      validatedSalesAmount: entry.breakdownPublic.validatedSalesAmount ?? 0,
      validatedSalesCount: entry.breakdownPublic.validatedSalesCount ?? 0,
      salesBonusPoints: entry.breakdownPublic.salesBonusPoints ?? 0,
      total: entry.score,
    },
    stats: {
      ...createEmptyStats(),
      validatedSalesCount: entry.breakdownPublic.validatedSalesCount ?? 0,
    },
    activitySummary: entry.summary,
  }))

  const podium: WeeklyRankingEntry[] = snapshot.podium.map((entry) => {
    const fullEntry = entries.find((item) => item.memberUid === entry.memberUid)

    return (
      fullEntry ?? {
        rank: entry.position,
        memberUid: entry.memberUid,
        memberName: entry.memberName,
        breakdown: {
          ...createEmptyBreakdown(),
          total: entry.score,
        },
        stats: createEmptyStats(),
        activitySummary: entry.summary,
      }
    )
  })

  const membersWithPointsCount = entries.filter((entry) => entry.breakdown.total > 0).length

  return {
    teamId: snapshot.teamId,
    period,
    entries,
    podium,
    membersWithPointsCount,
    hasActivity: membersWithPointsCount > 0,
    loadWarnings: [],
  }
}

export function findMemberRankingEntry(
  ranking: WeeklyRecognitionRanking,
  memberUid: string | null | undefined,
): WeeklyRankingEntry | null {
  if (!memberUid?.trim()) {
    return null
  }

  return ranking.entries.find((entry) => entry.memberUid === memberUid) ?? null
}
