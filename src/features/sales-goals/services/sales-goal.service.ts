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
  SalesGoalPeriodType,
  SalesReportStatus,
  TeamSalesGoal,
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
  buildSalesPeriodKey,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { createLeaderSalesReportNotification } from '@/features/sales-goals/services/sales-goal-notification.service'
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

function pickPreferredActiveGoal(activeGoals: TeamSalesGoal[]): TeamSalesGoal | null {
  if (activeGoals.length === 0) {
    return null
  }

  const monthlyKey = buildSalesPeriodKey('monthly').periodKey
  const weeklyKey = buildSalesPeriodKey('weekly').periodKey

  const currentMonthly = activeGoals.find((goal) => goal.periodKey === monthlyKey)
  const currentWeekly = activeGoals.find((goal) => goal.periodKey === weeklyKey)

  if (currentMonthly) {
    return currentMonthly
  }

  if (currentWeekly) {
    return currentWeekly
  }

  return (
    activeGoals.sort((left, right) => {
      const leftTime = left.updatedAt?.toMillis?.() ?? 0
      const rightTime = right.updatedAt?.toMillis?.() ?? 0
      return rightTime - leftTime
    })[0] ?? null
  )
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

  await Promise.all(
    goalsToClose.map((goal) =>
      updateDoc(doc(getFirebaseDb(), COLLECTIONS.teamSalesGoals, goal.id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      }),
    ),
  )
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
