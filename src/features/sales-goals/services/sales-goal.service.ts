import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import type {
  CreateTeamSalesReportInput,
  SalesGoalOutcome,
  SalesGoalPeriodType,
  SalesReportStatus,
  TeamSalesGoal,
  TeamSalesGoalHistory,
  TeamSalesGoalMemberBreakdown,
  TeamSalesReport,
  UpsertTeamSalesGoalInput,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  logSalesGoalSaveDebug,
  logSalesGoalSaveError,
  logSalesReportCreateDebug,
  logSalesReportCreateError,
  type SalesGoalSaveDebugContext,
  type SalesReportCreateDebugContext,
} from '@/features/sales-goals/utils/salesGoalDebug'
import {
  buildSalesGoalDocId,
  buildSalesGoalMemberBreakdown,
  buildSalesPeriodKey,
  getPreviousSalesPeriodDate,
  getSalesPeriodBounds,
  isGoalForCurrentPeriod,
  resolveSalesGoalOutcome,
  sumValidatedSalesReports,
} from '@/features/sales-goals/utils/salesGoalUtils'
import {
  createLeaderSalesReportNotification,
  createSalesGoalPeriodResultNotifications,
} from '@/features/sales-goals/services/sales-goal-notification.service'
import { recognitionWeeklySnapshotService } from '@/features/recognitions/services/recognition-weekly-snapshot.service'
import { teamService } from '@/features/team/services/team.service'
import { COLLECTIONS, getFirebaseDb } from '@/lib/firebase'

const MAX_REPORTS_FETCH = 50

function normalizePeriodType(value: unknown): SalesGoalPeriodType {
  return value === 'monthly' ? 'monthly' : 'weekly'
}

function normalizeCurrency(value: unknown): 'EUR' | 'USD' {
  return value === 'USD' ? 'USD' : 'EUR'
}

function normalizeGoalStatus(value: unknown): 'active' | 'closed' {
  return value === 'closed' ? 'closed' : 'active'
}

function normalizeReportStatus(value: unknown): SalesReportStatus {
  if (value === 'validated' || value === 'rejected') {
    return value
  }

  return 'reported'
}

function mapSalesGoalDocument(id: string, data: DocumentData): TeamSalesGoal {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    periodType: normalizePeriodType(data.periodType),
    periodKey: typeof data.periodKey === 'string' ? data.periodKey : '',
    periodLabel: typeof data.periodLabel === 'string' ? data.periodLabel : '',
    currency: normalizeCurrency(data.currency),
    targetAmount: typeof data.targetAmount === 'number' ? data.targetAmount : 0,
    currentAmount: typeof data.currentAmount === 'number' ? data.currentAmount : 0,
    description:
      typeof data.description === 'string' && data.description.trim().length > 0
        ? data.description.trim()
        : null,
    status: normalizeGoalStatus(data.status),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    recognitionEligible: data.recognitionEligible === true,
  }
}

function mapSalesReportDocument(id: string, data: DocumentData): TeamSalesReport {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    goalId: typeof data.goalId === 'string' ? data.goalId : '',
    memberUid: typeof data.memberUid === 'string' ? data.memberUid : '',
    memberName: typeof data.memberName === 'string' ? data.memberName : '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    currency: normalizeCurrency(data.currency),
    note:
      typeof data.note === 'string' && data.note.trim().length > 0 ? data.note.trim() : null,
    status: normalizeReportStatus(data.status),
    reportedAt: data.reportedAt ?? data.createdAt ?? null,
    validatedAt: data.validatedAt ?? null,
    validatedByUid:
      typeof data.validatedByUid === 'string' && data.validatedByUid.trim().length > 0
        ? data.validatedByUid.trim()
        : null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    recognitionPointsPending: data.recognitionPointsPending === true,
  }
}

function normalizeOutcome(value: unknown): SalesGoalOutcome {
  return value === 'achieved' ? 'achieved' : 'missed'
}

function mapMemberBreakdown(value: unknown): TeamSalesGoalMemberBreakdown[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const item = entry as Record<string, unknown>
      const memberUid = typeof item.memberUid === 'string' ? item.memberUid.trim() : ''
      const memberName =
        typeof item.memberName === 'string' && item.memberName.trim().length > 0
          ? item.memberName.trim()
          : 'Miembro del equipo'

      if (!memberUid) {
        return null
      }

      return {
        memberUid,
        memberName,
        validatedAmount:
          typeof item.validatedAmount === 'number' ? Math.max(item.validatedAmount, 0) : 0,
        reportedCount:
          typeof item.reportedCount === 'number' ? Math.max(Math.floor(item.reportedCount), 0) : 0,
        validatedCount:
          typeof item.validatedCount === 'number'
            ? Math.max(Math.floor(item.validatedCount), 0)
            : 0,
      } satisfies TeamSalesGoalMemberBreakdown
    })
    .filter((entry): entry is TeamSalesGoalMemberBreakdown => entry !== null)
}

function mapSalesGoalHistoryDocument(id: string, data: DocumentData): TeamSalesGoalHistory {
  return {
    id,
    teamId: typeof data.teamId === 'string' ? data.teamId : '',
    goalId: typeof data.goalId === 'string' ? data.goalId : id,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : '',
    periodType: normalizePeriodType(data.periodType),
    periodKey: typeof data.periodKey === 'string' ? data.periodKey : '',
    periodLabel: typeof data.periodLabel === 'string' ? data.periodLabel : '',
    currency: normalizeCurrency(data.currency),
    targetAmount: typeof data.targetAmount === 'number' ? data.targetAmount : 0,
    finalAmount: typeof data.finalAmount === 'number' ? data.finalAmount : 0,
    outcome: normalizeOutcome(data.outcome),
    memberBreakdown: mapMemberBreakdown(data.memberBreakdown),
    closedAt: data.closedAt ?? null,
    createdAt: data.createdAt ?? null,
    notifiedAt: data.notifiedAt ?? null,
  }
}

function sortReportsByReportedAtDesc(reports: TeamSalesReport[]): TeamSalesReport[] {
  return [...reports].sort((left, right) => {
    const leftTime = left.reportedAt?.toMillis?.() ?? left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.reportedAt?.toMillis?.() ?? right.createdAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

async function queryTeamGoals(teamId: string): Promise<TeamSalesGoal[]> {
  const goalsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesGoals),
    where('teamId', '==', teamId),
  )

  const snapshot = await getDocs(goalsQuery)
  return snapshot.docs.map((goalDoc) => mapSalesGoalDocument(goalDoc.id, goalDoc.data()))
}

async function queryTeamReports(teamId: string): Promise<TeamSalesReport[]> {
  const reportsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
    where('teamId', '==', teamId),
  )

  const snapshot = await getDocs(reportsQuery)
  return sortReportsByReportedAtDesc(
    snapshot.docs.map((reportDoc) => mapSalesReportDocument(reportDoc.id, reportDoc.data())),
  ).slice(0, MAX_REPORTS_FETCH)
}

async function queryValidatedTeamReports(teamId: string): Promise<TeamSalesReport[]> {
  const reportsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
    where('teamId', '==', teamId),
    where('status', '==', 'validated'),
  )

  const snapshot = await getDocs(reportsQuery)
  return sortReportsByReportedAtDesc(
    snapshot.docs.map((reportDoc) => mapSalesReportDocument(reportDoc.id, reportDoc.data())),
  ).slice(0, MAX_REPORTS_FETCH)
}

function filterValidatedReportsInPeriod(
  reports: TeamSalesReport[],
  period: { startMs: number; endMs: number },
): TeamSalesReport[] {
  return reports.filter((report) => {
    if (report.status !== 'validated') {
      return false
    }

    const timestamp = report.validatedAt ?? report.updatedAt
    const millis = timestamp?.toMillis?.()

    if (typeof millis !== 'number') {
      return false
    }

    return millis >= period.startMs && millis <= period.endMs
  })
}

async function queryMemberReports(
  teamId: string,
  memberUid: string,
): Promise<TeamSalesReport[]> {
  const reportsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
    where('teamId', '==', teamId),
    where('memberUid', '==', memberUid),
  )

  const snapshot = await getDocs(reportsQuery)
  return sortReportsByReportedAtDesc(
    snapshot.docs.map((reportDoc) => mapSalesReportDocument(reportDoc.id, reportDoc.data())),
  ).slice(0, MAX_REPORTS_FETCH)
}

async function queryReportsByGoalId(goalId: string): Promise<TeamSalesReport[]> {
  const reportsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
    where('goalId', '==', goalId),
  )

  const snapshot = await getDocs(reportsQuery)
  return sortReportsByReportedAtDesc(
    snapshot.docs.map((reportDoc) => mapSalesReportDocument(reportDoc.id, reportDoc.data())),
  )
}

async function queryAllTeamReports(teamId: string): Promise<TeamSalesReport[]> {
  const reportsQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
    where('teamId', '==', teamId),
  )

  const snapshot = await getDocs(reportsQuery)
  return sortReportsByReportedAtDesc(
    snapshot.docs.map((reportDoc) => mapSalesReportDocument(reportDoc.id, reportDoc.data())),
  )
}

function filterReportsInPeriodBounds(
  reports: TeamSalesReport[],
  bounds: { startMs: number; endMs: number; periodKey?: string },
): TeamSalesReport[] {
  return reports.filter((report) => {
    const timestamp =
      report.validatedAt ?? report.reportedAt ?? report.updatedAt ?? report.createdAt
    const millis = timestamp?.toMillis?.()

    if (typeof millis === 'number') {
      return millis >= bounds.startMs && millis <= bounds.endMs
    }

    // Si no hay fecha, asociar por goalId del periodo (p. ej. ..._monthly_2026-06).
    if (bounds.periodKey && report.goalId.includes(bounds.periodKey)) {
      return true
    }

    return false
  })
}

async function getHistoryDocumentById(historyId: string): Promise<TeamSalesGoalHistory | null> {
  const snapshot = await getDoc(
    doc(getFirebaseDb(), COLLECTIONS.teamSalesGoalHistory, historyId),
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapSalesGoalHistoryDocument(snapshot.id, snapshot.data())
}

async function buildHistoryEntryFromGoal(
  goal: TeamSalesGoal,
  reports: TeamSalesReport[],
  members: Awaited<ReturnType<typeof teamService.getTeamMembersByTeamId>>,
): Promise<TeamSalesGoalHistory> {
  const goalReports = reports.filter((report) => report.goalId === goal.id)
  const memberBreakdown = buildSalesGoalMemberBreakdown(goalReports, members).slice(0, 20)
  const validatedAmount = sumValidatedSalesReports(goalReports)
  const finalAmount = Math.max(validatedAmount, goal.currentAmount, 0)

  return {
    id: goal.id,
    teamId: goal.teamId,
    goalId: goal.id,
    ownerUid: goal.ownerUid,
    periodType: goal.periodType,
    periodKey: goal.periodKey,
    periodLabel: goal.periodLabel,
    currency: goal.currency,
    targetAmount: goal.targetAmount,
    finalAmount,
    outcome: resolveSalesGoalOutcome(finalAmount, goal.targetAmount),
    memberBreakdown,
    closedAt: goal.status === 'closed' ? goal.updatedAt : null,
    createdAt: goal.createdAt,
    notifiedAt: null,
  }
}

function buildMonthlyHistoryFromReports(
  teamId: string,
  ownerUid: string,
  reports: TeamSalesReport[],
  members: Awaited<ReturnType<typeof teamService.getTeamMembersByTeamId>>,
  monthsBack = 6,
): TeamSalesGoalHistory[] {
  const now = new Date()
  const entries: TeamSalesGoalHistory[] = []

  for (let offset = 1; offset <= monthsBack; offset += 1) {
    const referenceDate = new Date(now.getFullYear(), now.getMonth() - offset, 15)
    const bounds = getSalesPeriodBounds('monthly', referenceDate)
    const periodReports = filterReportsInPeriodBounds(reports, bounds)

    if (periodReports.length === 0) {
      continue
    }

    const memberBreakdown = buildSalesGoalMemberBreakdown(periodReports, members).slice(0, 20)
    const finalAmount = sumValidatedSalesReports(periodReports)
    const currency = periodReports[0]?.currency ?? 'EUR'
    const goalId = buildSalesGoalDocId(teamId, bounds.periodKey)

    entries.push({
      id: `reports_${goalId}`,
      teamId,
      goalId,
      ownerUid,
      periodType: 'monthly',
      periodKey: bounds.periodKey,
      periodLabel: bounds.periodLabel,
      currency,
      targetAmount: 0,
      finalAmount,
      outcome: 'missed',
      memberBreakdown,
      closedAt: null,
      createdAt: null,
      notifiedAt: null,
    })
  }

  return entries
}

async function buildMonthlyHistoryFromRecognitionSnapshots(
  teamId: string,
  ownerUid: string,
  monthsBack = 6,
): Promise<TeamSalesGoalHistory[]> {
  const snapshots = await recognitionWeeklySnapshotService
    .listPublishedSnapshotsByTeamId(teamId)
    .catch(() => [])

  if (snapshots.length === 0) {
    return []
  }

  const now = new Date()
  const entries: TeamSalesGoalHistory[] = []

  for (let offset = 1; offset <= monthsBack; offset += 1) {
    const referenceDate = new Date(now.getFullYear(), now.getMonth() - offset, 15)
    const bounds = getSalesPeriodBounds('monthly', referenceDate)
    const monthSnapshots = snapshots.filter((snapshot) => {
      const startMs = Date.parse(`${snapshot.weekStartDate}T00:00:00`)
      const endMs = Date.parse(`${snapshot.weekEndDate}T23:59:59`)

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return false
      }

      return startMs <= bounds.endMs && endMs >= bounds.startMs
    })

    if (monthSnapshots.length === 0) {
      continue
    }

    const byMember = new Map<
      string,
      { memberUid: string; memberName: string; validatedAmount: number; validatedCount: number }
    >()

    for (const snapshot of monthSnapshots) {
      for (const entry of snapshot.ranking) {
        const amount = entry.breakdownPublic.validatedSalesAmount
        const count = entry.breakdownPublic.validatedSalesCount

        if (amount <= 0 && count <= 0) {
          continue
        }

        const existing = byMember.get(entry.memberUid) ?? {
          memberUid: entry.memberUid,
          memberName: entry.memberName,
          validatedAmount: 0,
          validatedCount: 0,
        }

        existing.memberName = entry.memberName || existing.memberName
        existing.validatedAmount += amount
        existing.validatedCount += count
        byMember.set(entry.memberUid, existing)
      }
    }

    if (byMember.size === 0) {
      continue
    }

    const memberBreakdown = [...byMember.values()]
      .map((member) => ({
        memberUid: member.memberUid,
        memberName: member.memberName,
        validatedAmount: member.validatedAmount,
        reportedCount: member.validatedCount,
        validatedCount: member.validatedCount,
      }))
      .sort((left, right) => right.validatedAmount - left.validatedAmount)
      .slice(0, 20)

    const finalAmount = memberBreakdown.reduce((total, member) => total + member.validatedAmount, 0)
    const goalId = buildSalesGoalDocId(teamId, bounds.periodKey)

    entries.push({
      id: `recognition_${goalId}`,
      teamId,
      goalId,
      ownerUid,
      periodType: 'monthly',
      periodKey: bounds.periodKey,
      periodLabel: bounds.periodLabel,
      currency: 'EUR',
      targetAmount: 0,
      finalAmount,
      outcome: 'missed',
      memberBreakdown,
      closedAt: null,
      createdAt: null,
      notifiedAt: null,
    })
  }

  return entries
}

function preferHistoryEntry(
  current: TeamSalesGoalHistory | undefined,
  next: TeamSalesGoalHistory,
): TeamSalesGoalHistory {
  if (!current) {
    return next
  }

  const currentSynthetic = current.id.startsWith('reports_')
  const nextSynthetic = next.id.startsWith('reports_')

  if (currentSynthetic && !nextSynthetic) {
    return next
  }

  if (!currentSynthetic && nextSynthetic) {
    return current
  }

  if (current.targetAmount > 0 && next.targetAmount <= 0) {
    return current
  }

  if (next.targetAmount > 0 && current.targetAmount <= 0) {
    return next
  }

  return current.memberBreakdown.length >= next.memberBreakdown.length ? current : next
}

async function collectTeamSalesHistory(
  teamId: string,
  options: {
    ownerUid?: string | null
    persist?: boolean
    senderName?: string
  } = {},
): Promise<TeamSalesGoalHistory[]> {
  const ownerUid = options.ownerUid?.trim() || ''
  const senderName = options.senderName?.trim() || 'Líder del equipo'
  const shouldPersist = options.persist !== false && Boolean(ownerUid)

  const [storedHistory, goals, allReports] = await Promise.all([
    queryTeamGoalHistory(teamId).catch(() => [] as TeamSalesGoalHistory[]),
    queryTeamGoals(teamId),
    queryAllTeamReports(teamId).catch(() => [] as TeamSalesReport[]),
  ])

  const members = ownerUid
    ? await teamService.getTeamMembersByTeamId(teamId, ownerUid).catch(() => [])
    : []

  const currentMonthlyKey = buildSalesPeriodKey('monthly').periodKey
  const currentWeeklyKey = buildSalesPeriodKey('weekly').periodKey
  const byGoalId = new Map<string, TeamSalesGoalHistory>()

  for (const entry of storedHistory) {
    byGoalId.set(entry.goalId || entry.id, entry)
  }

  for (const goal of goals) {
    const isCurrentPeriod =
      goal.periodKey === currentMonthlyKey || goal.periodKey === currentWeeklyKey

    if (isCurrentPeriod && goal.status === 'active') {
      continue
    }

    if (shouldPersist && !isCurrentPeriod) {
      try {
        if (goal.status === 'active') {
          const closed = await closeExpiredGoalWithHistory(goal, { ownerUid, senderName })
          if (closed) {
            byGoalId.set(closed.goalId || closed.id, preferHistoryEntry(byGoalId.get(closed.goalId || closed.id), closed))
            continue
          }
        } else if (!byGoalId.has(goal.id)) {
          const written = await writeGoalHistoryDocument(goal, {
            ownerUid,
            senderName,
            notify: false,
          })
          if (written) {
            byGoalId.set(written.goalId || written.id, preferHistoryEntry(byGoalId.get(written.goalId || written.id), written))
            continue
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[SalesGoal] history persist from goal failed', goal.id, error)
        }
      }
    }

    const entry = await buildHistoryEntryFromGoal(goal, allReports, members)
    byGoalId.set(entry.goalId, preferHistoryEntry(byGoalId.get(entry.goalId), entry))
  }

  // Meses anteriores a partir de ventas (aunque no exista documento de objetivo).
  for (const entry of buildMonthlyHistoryFromReports(teamId, ownerUid, allReports, members, 6)) {
    const existing = byGoalId.get(entry.goalId)
    if (existing && !existing.id.startsWith('reports_') && !existing.id.startsWith('recognition_')) {
      continue
    }

    byGoalId.set(entry.goalId, preferHistoryEntry(existing, entry))
  }

  // Fallback: impacto comercial de snapshots de Reconocimientos del mes.
  for (const entry of await buildMonthlyHistoryFromRecognitionSnapshots(teamId, ownerUid, 6)) {
    const existing = byGoalId.get(entry.goalId)
    if (
      existing &&
      !existing.id.startsWith('reports_') &&
      !existing.id.startsWith('recognition_')
    ) {
      continue
    }

    if (existing && existing.finalAmount >= entry.finalAmount) {
      continue
    }

    byGoalId.set(entry.goalId, preferHistoryEntry(existing, entry))
  }

  // También intenta mes y semana anterior por si el objetivo existe pero no salió en query.
  const [pastMonthly, pastWeekly] = await Promise.all([
    rebuildPastPeriodHistoryEntry(teamId, 'monthly', {
      ownerUid,
      persist: shouldPersist,
      senderName,
    }).catch(() => null),
    rebuildPastPeriodHistoryEntry(teamId, 'weekly', {
      ownerUid,
      persist: shouldPersist,
      senderName,
    }).catch(() => null),
  ])

  for (const entry of [pastMonthly, pastWeekly]) {
    if (!entry) {
      continue
    }

    byGoalId.set(entry.goalId || entry.id, preferHistoryEntry(byGoalId.get(entry.goalId || entry.id), entry))
  }

  if (import.meta.env.DEV) {
    console.info('[SalesGoal] history collected', {
      teamId,
      goals: goals.length,
      reports: allReports.length,
      historyEntries: byGoalId.size,
      stored: storedHistory.length,
    })
  }

  return [...byGoalId.values()].sort((left, right) => {
    const leftTime = left.closedAt?.toMillis?.() ?? left.createdAt?.toMillis?.() ?? 0
    const rightTime = right.closedAt?.toMillis?.() ?? right.createdAt?.toMillis?.() ?? 0

    if (rightTime !== leftTime) {
      return rightTime - leftTime
    }

    return right.periodKey.localeCompare(left.periodKey)
  })
}

async function rebuildPastPeriodHistoryEntry(
  teamId: string,
  periodType: SalesGoalPeriodType,
  options: {
    ownerUid?: string | null
    persist?: boolean
    senderName?: string
  } = {},
): Promise<TeamSalesGoalHistory | null> {
  const previousDate = getPreviousSalesPeriodDate(periodType)
  const bounds = getSalesPeriodBounds(periodType, previousDate)
  const goalId = buildSalesGoalDocId(teamId, bounds.periodKey)

  const existingHistory = await getHistoryDocumentById(goalId)

  if (existingHistory) {
    return existingHistory
  }

  const goal = await salesGoalServiceGetGoalById(goalId)
  const ownerUid = options.ownerUid?.trim() || goal?.ownerUid?.trim() || ''

  if (goal && ownerUid && options.persist !== false) {
    try {
      if (goal.status === 'active') {
        return await closeExpiredGoalWithHistory(goal, {
          ownerUid,
          senderName: options.senderName?.trim() || 'Líder del equipo',
        })
      }

      return await writeGoalHistoryDocument(goal, {
        ownerUid,
        senderName: options.senderName?.trim() || 'Líder del equipo',
        notify: false,
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[SalesGoal] failed to persist past period history', goalId, error)
      }
    }
  }

  if (goal) {
    const reports = await queryReportsByGoalId(goal.id)
    const members = ownerUid
      ? await teamService.getTeamMembersByTeamId(teamId, ownerUid).catch(() => [])
      : []
    const memberBreakdown = buildSalesGoalMemberBreakdown(reports, members).slice(0, 20)
    const validatedAmount = sumValidatedSalesReports(reports)
    const finalAmount = Math.max(validatedAmount, goal.currentAmount, 0)

    return {
      id: goal.id,
      teamId,
      goalId: goal.id,
      ownerUid: goal.ownerUid,
      periodType: goal.periodType,
      periodKey: goal.periodKey,
      periodLabel: goal.periodLabel || bounds.periodLabel,
      currency: goal.currency,
      targetAmount: goal.targetAmount,
      finalAmount,
      outcome: resolveSalesGoalOutcome(finalAmount, goal.targetAmount),
      memberBreakdown,
      closedAt: goal.updatedAt,
      createdAt: goal.createdAt,
      notifiedAt: null,
    }
  }

  const allReports = await queryAllTeamReports(teamId)
  const periodReports = filterReportsInPeriodBounds(allReports, bounds)

  if (periodReports.length === 0) {
    return null
  }

  const members = ownerUid
    ? await teamService.getTeamMembersByTeamId(teamId, ownerUid).catch(() => [])
    : []
  const memberBreakdown = buildSalesGoalMemberBreakdown(periodReports, members).slice(0, 20)
  const finalAmount = sumValidatedSalesReports(periodReports)
  const currency = periodReports[0]?.currency ?? 'EUR'

  return {
    id: `reports_${goalId}`,
    teamId,
    goalId,
    ownerUid: ownerUid || '',
    periodType,
    periodKey: bounds.periodKey,
    periodLabel: bounds.periodLabel,
    currency,
    targetAmount: 0,
    finalAmount,
    outcome: 'missed',
    memberBreakdown,
    closedAt: null,
    createdAt: null,
    notifiedAt: null,
  }
}

/** Local helper to avoid circular reference while rebuilding. */
async function salesGoalServiceGetGoalById(goalId: string): Promise<TeamSalesGoal | null> {
  const normalizedGoalId = goalId.trim()

  if (!normalizedGoalId) {
    return null
  }

  const snapshot = await getDoc(
    doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, normalizedGoalId),
  )

  if (!snapshot.exists()) {
    return null
  }

  return mapSalesGoalDocument(snapshot.id, snapshot.data())
}

async function queryTeamGoalHistory(teamId: string): Promise<TeamSalesGoalHistory[]> {
  const historyQuery = query(
    collection(getFirebaseDb(), COLLECTIONS.teamSalesGoalHistory),
    where('teamId', '==', teamId),
  )

  const snapshot = await getDocs(historyQuery)
  return snapshot.docs
    .map((historyDoc) => mapSalesGoalHistoryDocument(historyDoc.id, historyDoc.data()))
    .sort((left, right) => {
      const leftTime = left.closedAt?.toMillis?.() ?? left.createdAt?.toMillis?.() ?? 0
      const rightTime = right.closedAt?.toMillis?.() ?? right.createdAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })
}

function pickPreferredActiveGoal(activeGoals: TeamSalesGoal[]): TeamSalesGoal | null {
  if (activeGoals.length === 0) {
    return null
  }

  const monthlyKey = buildSalesPeriodKey('monthly').periodKey
  const weeklyKey = buildSalesPeriodKey('weekly').periodKey

  const currentMonthly = activeGoals.find((goal) => goal.periodKey === monthlyKey)
  const currentWeekly = activeGoals.find((goal) => goal.periodKey === weeklyKey)

  return currentMonthly ?? currentWeekly ?? null
}

async function closeGoalDocument(goalId: string, finalAmount?: number): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, goalId), {
    status: 'closed',
    ...(typeof finalAmount === 'number' ? { currentAmount: Math.max(finalAmount, 0) } : {}),
    updatedAt: serverTimestamp(),
  })
}

async function ensureNextPeriodGoalFromClosed(goal: TeamSalesGoal): Promise<void> {
  const { periodKey, periodLabel } = buildSalesPeriodKey(goal.periodType)
  const nextGoalId = buildSalesGoalDocId(goal.teamId, periodKey)

  if (nextGoalId === goal.id) {
    return
  }

  const nextGoalRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, nextGoalId)
  const existingNext = await getDoc(nextGoalRef)

  if (existingNext.exists()) {
    return
  }

  await setDoc(nextGoalRef, {
    teamId: goal.teamId,
    ownerUid: goal.ownerUid,
    periodType: goal.periodType,
    periodKey,
    periodLabel,
    currency: goal.currency,
    targetAmount: goal.targetAmount,
    currentAmount: 0,
    description: goal.description ?? null,
    status: 'active',
    recognitionEligible: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

async function writeGoalHistoryDocument(
  goal: TeamSalesGoal,
  options: {
    ownerUid: string
    notify: boolean
    senderName: string
  },
): Promise<TeamSalesGoalHistory | null> {
  const historyRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesGoalHistory, goal.id)
  const existingHistory = await getDoc(historyRef)

  if (existingHistory.exists()) {
    return mapSalesGoalHistoryDocument(existingHistory.id, existingHistory.data())
  }

  const reports = await queryReportsByGoalId(goal.id)
  const members = await teamService
    .getTeamMembersByTeamId(goal.teamId, options.ownerUid)
    .catch(() => [])
  const memberBreakdown = buildSalesGoalMemberBreakdown(reports, members).slice(0, 20)
  const validatedAmount = sumValidatedSalesReports(reports)
  const finalAmount = Math.max(validatedAmount, goal.currentAmount, 0)
  const outcome = resolveSalesGoalOutcome(finalAmount, goal.targetAmount)

  const historyPayload = {
    teamId: goal.teamId,
    goalId: goal.id,
    ownerUid: options.ownerUid,
    periodType: goal.periodType,
    periodKey: goal.periodKey,
    periodLabel: goal.periodLabel,
    currency: goal.currency,
    targetAmount: goal.targetAmount,
    finalAmount,
    outcome,
    memberBreakdown,
    closedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    notifiedAt: serverTimestamp(),
  }

  await setDoc(historyRef, historyPayload)

  const history: TeamSalesGoalHistory = {
    id: goal.id,
    teamId: goal.teamId,
    goalId: goal.id,
    ownerUid: options.ownerUid,
    periodType: goal.periodType,
    periodKey: goal.periodKey,
    periodLabel: goal.periodLabel,
    currency: goal.currency,
    targetAmount: goal.targetAmount,
    finalAmount,
    outcome,
    memberBreakdown,
    closedAt: null,
    createdAt: null,
    notifiedAt: null,
  }

  if (options.notify) {
    await createSalesGoalPeriodResultNotifications(history, {
      senderUid: options.ownerUid,
      senderName: options.senderName,
    })
  }

  return history
}

async function closeExpiredGoalWithHistory(
  goal: TeamSalesGoal,
  options: {
    ownerUid: string
    senderName: string
  },
): Promise<TeamSalesGoalHistory | null> {
  const historyRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesGoalHistory, goal.id)
  const existingHistory = await getDoc(historyRef)

  if (existingHistory.exists()) {
    if (goal.status === 'active') {
      await closeGoalDocument(goal.id).catch(() => undefined)
    }

    await ensureNextPeriodGoalFromClosed(goal).catch(() => undefined)
    return mapSalesGoalHistoryDocument(existingHistory.id, existingHistory.data())
  }

  const history = await writeGoalHistoryDocument(goal, {
    ownerUid: options.ownerUid,
    senderName: options.senderName,
    notify: true,
  })

  if (goal.status === 'active') {
    await closeGoalDocument(goal.id, history?.finalAmount)
  }

  await ensureNextPeriodGoalFromClosed(goal)

  return history
}

async function closeOtherActiveGoalsForPeriod(
  teamId: string,
  keepGoalId: string,
  periodType: SalesGoalPeriodType,
): Promise<void> {
  const goals = await queryTeamGoals(teamId)
  const goalsToClose = goals.filter(
    (goal) =>
      goal.id !== keepGoalId &&
      goal.status === 'active' &&
      goal.periodType === periodType,
  )

  if (goalsToClose.length === 0) {
    return
  }

  for (const goal of goalsToClose) {
    try {
      if (!isGoalForCurrentPeriod(goal)) {
        await writeGoalHistoryDocument(goal, {
          ownerUid: goal.ownerUid,
          senderName: 'Líder del equipo',
          notify: false,
        })
      }

      await closeGoalDocument(goal.id)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[SalesGoal] failed to close sibling goal', goal.id, error)
      }
    }
  }
}

export const salesGoalService = {
  async getActiveGoalForTeam(teamId: string): Promise<TeamSalesGoal | null> {
    const normalizedTeamId = teamId.trim()

    if (!normalizedTeamId) {
      return null
    }

    const goals = await queryTeamGoals(normalizedTeamId)
    const activeGoals = goals.filter((goal) => goal.status === 'active')

    return pickPreferredActiveGoal(activeGoals)
  },

  async ensureExpiredGoalsRollover(
    teamId: string,
    options: {
      ownerUid: string
      senderName?: string
    },
  ): Promise<TeamSalesGoalHistory[]> {
    const normalizedTeamId = teamId.trim()
    const ownerUid = options.ownerUid.trim()

    if (!normalizedTeamId || !ownerUid) {
      return []
    }

    const goals = await queryTeamGoals(normalizedTeamId)
    const senderName = options.senderName?.trim() || 'Líder del equipo'
    const closedHistories: TeamSalesGoalHistory[] = []

    const expiredActiveGoals = goals.filter(
      (goal) => goal.status === 'active' && !isGoalForCurrentPeriod(goal),
    )

    for (const goal of expiredActiveGoals) {
      try {
        const history = await closeExpiredGoalWithHistory(goal, {
          ownerUid,
          senderName,
        })

        if (history) {
          closedHistories.push(history)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[SalesGoal] failed to close expired goal', goal.id, error)
        }
      }
    }

    // Migrar objetivos ya cerrados de periodos anteriores al historial (sin re-notificar).
    const closedPastGoals = goals.filter(
      (goal) => goal.status === 'closed' && !isGoalForCurrentPeriod(goal),
    )

    for (const goal of closedPastGoals) {
      try {
        const history = await writeGoalHistoryDocument(goal, {
          ownerUid,
          senderName,
          notify: false,
        })

        if (history) {
          closedHistories.push(history)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('[SalesGoal] failed to backfill closed goal history', goal.id, error)
        }
      }
    }

    return closedHistories
  },

  async getHistoryForTeam(
    teamId: string,
    limit = 12,
    options: {
      ownerUid?: string | null
      persist?: boolean
      senderName?: string
    } = {},
  ): Promise<TeamSalesGoalHistory[]> {
    const normalizedTeamId = teamId.trim()

    if (!normalizedTeamId) {
      return []
    }

    const history = await collectTeamSalesHistory(normalizedTeamId, options)
    return history.slice(0, Math.max(limit, 1))
  },

  async getGoalById(goalId: string): Promise<TeamSalesGoal | null> {
    const normalizedGoalId = goalId.trim()

    if (!normalizedGoalId) {
      return null
    }

    const snapshot = await getDoc(
      doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, normalizedGoalId),
    )

    if (!snapshot.exists()) {
      return null
    }

    return mapSalesGoalDocument(snapshot.id, snapshot.data())
  },

  async upsertGoal(
    input: UpsertTeamSalesGoalInput,
    debugContext: SalesGoalSaveDebugContext = {},
  ): Promise<TeamSalesGoal> {
    const normalizedTeamId = input.teamId.trim()
    const ownerUid = input.ownerUid.trim()
    const targetAmount = Number(input.targetAmount)

    if (!normalizedTeamId || !ownerUid || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      throw new Error('Invalid sales goal payload')
    }

    await this.ensureExpiredGoalsRollover(normalizedTeamId, {
      ownerUid,
      senderName: debugContext.authEmail?.split('@')[0] || 'Líder del equipo',
    }).catch((rolloverError) => {
      if (import.meta.env.DEV) {
        console.warn('[SalesGoal] rollover before upsert failed', rolloverError)
      }
    })

    const { periodKey, periodLabel } = buildSalesPeriodKey(input.periodType)
    const goalId = buildSalesGoalDocId(normalizedTeamId, periodKey)
    const goalRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, goalId)
    const teamGoals = await queryTeamGoals(normalizedTeamId)
    const existingGoal = teamGoals.find((goal) => goal.id === goalId) ?? null
    const isUpdate = Boolean(existingGoal)

    const createPayload = {
      teamId: normalizedTeamId,
      ownerUid,
      periodType: input.periodType,
      periodKey,
      periodLabel,
      currency: input.currency,
      targetAmount,
      currentAmount: existingGoal?.currentAmount ?? 0,
      description: input.description?.trim() || null,
      status: 'active' as const,
      recognitionEligible: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const updatePayload = {
      periodType: input.periodType,
      periodKey,
      periodLabel,
      currency: input.currency,
      targetAmount,
      description: input.description?.trim() || null,
      status: 'active' as const,
      recognitionEligible: true,
      updatedAt: serverTimestamp(),
    }

    logSalesGoalSaveDebug(debugContext, {
      goalId,
      isUpdate,
      payload: isUpdate ? updatePayload : createPayload,
    })

    try {
      if (isUpdate) {
        await updateDoc(goalRef, updatePayload)
      } else {
        await setDoc(goalRef, createPayload)
      }

      await closeOtherActiveGoalsForPeriod(normalizedTeamId, goalId, input.periodType).catch(
        (closeError) => {
          logSalesGoalSaveError(closeError, debugContext, {
            goalId,
            payload: { phase: 'closeOtherActiveGoalsForPeriod', periodType: input.periodType },
          })
        },
      )

      const saved = await getDoc(goalRef)

      if (!saved.exists()) {
        throw new Error('Sales goal was not persisted')
      }

      return mapSalesGoalDocument(saved.id, saved.data())
    } catch (error) {
      logSalesGoalSaveError(error, debugContext, {
        goalId,
        payload: isUpdate ? updatePayload : createPayload,
      })
      throw error
    }
  },

  async getReportsForTeam(
    teamId: string,
    options: { goalId?: string; memberUid?: string; leaderView?: boolean } = {},
  ): Promise<TeamSalesReport[]> {
    const normalizedTeamId = teamId.trim()

    if (!normalizedTeamId) {
      return []
    }

    const normalizedMemberUid = options.memberUid?.trim()

    const reports = options.leaderView
      ? await queryTeamReports(normalizedTeamId)
      : normalizedMemberUid
        ? await queryMemberReports(normalizedTeamId, normalizedMemberUid)
        : []

    return reports.filter((report) => {
      if (options.goalId && report.goalId !== options.goalId) {
        return false
      }

      return true
    })
  },

  async createReport(
    input: CreateTeamSalesReportInput,
    options: {
      debugContext?: SalesReportCreateDebugContext
      goal?: TeamSalesGoal | null
    } = {},
  ): Promise<TeamSalesReport> {
    const amount = Number(input.amount)
    const normalizedTeamId = input.teamId.trim()
    const normalizedGoalId = input.goalId.trim()
    const normalizedMemberUid = input.memberUid.trim()
    const normalizedMemberName = input.memberName.trim()
    const goalTeamId = options.goal?.teamId.trim() || normalizedTeamId

    if (
      !normalizedTeamId ||
      !normalizedGoalId ||
      !normalizedMemberUid ||
      !normalizedMemberName
    ) {
      throw new Error('Invalid sales report context')
    }

    if (options.goal && options.goal.status !== 'active') {
      throw new Error('No active sales goal to report against')
    }

    if (options.goal && options.goal.id !== normalizedGoalId) {
      throw new Error('Sales report goal mismatch')
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid sales report amount')
    }

    const payload = {
      teamId: goalTeamId,
      goalId: normalizedGoalId,
      memberUid: normalizedMemberUid,
      memberName: normalizedMemberName,
      amount,
      currency: input.currency,
      note: input.note?.trim() || null,
      status: 'reported' as const,
      reportedAt: serverTimestamp(),
      validatedAt: null,
      validatedByUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      recognitionPointsPending: true,
    }

    const debugContext: SalesReportCreateDebugContext = {
      ...options.debugContext,
      effectiveTeamId: goalTeamId,
      goalId: normalizedGoalId,
      goalTeamId,
      goalStatus: options.goal?.status ?? null,
    }

    logSalesReportCreateDebug(debugContext, payload)

    try {
      const createdDoc = await addDoc(
        collection(getFirebaseDb(), COLLECTIONS.teamSalesReports),
        payload,
      )

      const createdReport: TeamSalesReport = {
        id: createdDoc.id,
        ...payload,
        reportedAt: null,
        validatedAt: null,
        validatedByUid: null,
        createdAt: null,
        updatedAt: null,
      }

      void createLeaderSalesReportNotification(
        createdReport,
        options.debugContext?.authUid ?? normalizedMemberUid,
      )

      return createdReport
    } catch (error) {
      logSalesReportCreateError(error, debugContext, payload)
      throw error
    }
  },

  async updateReportStatus(
    reportId: string,
    status: Extract<SalesReportStatus, 'validated' | 'rejected'>,
    validatorUid: string,
  ): Promise<void> {
    const normalizedReportId = reportId.trim()
    const normalizedValidatorUid = validatorUid.trim()

    if (!normalizedReportId || !normalizedValidatorUid) {
      throw new Error('Invalid report validation payload')
    }

    const reportRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesReports, normalizedReportId)
    const reportSnapshot = await getDoc(reportRef)

    if (!reportSnapshot.exists()) {
      throw new Error('Sales report not found')
    }

    const report = mapSalesReportDocument(reportSnapshot.id, reportSnapshot.data())

    if (report.status !== 'reported') {
      return
    }

    const payload =
      status === 'validated'
        ? {
            status,
            validatedAt: serverTimestamp(),
            validatedByUid: normalizedValidatorUid,
            updatedAt: serverTimestamp(),
            recognitionPointsPending: true,
          }
        : {
            status,
            validatedAt: null,
            validatedByUid: null,
            updatedAt: serverTimestamp(),
            recognitionPointsPending: false,
          }

    await updateDoc(reportRef, payload)

    if (status !== 'validated') {
      return
    }

    const goalRef = doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, report.goalId)
    const goalSnapshot = await getDoc(goalRef)

    if (!goalSnapshot.exists()) {
      return
    }

    const currentAmount =
      typeof goalSnapshot.data()?.currentAmount === 'number'
        ? goalSnapshot.data()?.currentAmount
        : 0

    await updateDoc(goalRef, {
      currentAmount: currentAmount + report.amount,
      updatedAt: serverTimestamp(),
    })
  },

  async getValidatedReportsForRanking(
    teamId: string,
    period: { startMs: number; endMs: number },
  ): Promise<TeamSalesReport[]> {
    const normalizedTeamId = teamId.trim()

    if (!normalizedTeamId) {
      return []
    }

    const reports = await queryValidatedTeamReports(normalizedTeamId)
    return filterValidatedReportsInPeriod(reports, period)
  },

  async getMemberValidatedReportsForRanking(
    teamId: string,
    memberUid: string,
    period: { startMs: number; endMs: number },
  ): Promise<TeamSalesReport[]> {
    const normalizedTeamId = teamId.trim()
    const normalizedMemberUid = memberUid.trim()

    if (!normalizedTeamId || !normalizedMemberUid) {
      return []
    }

    const reports = await queryMemberReports(normalizedTeamId, normalizedMemberUid)
    return filterValidatedReportsInPeriod(reports, period)
  },
}
