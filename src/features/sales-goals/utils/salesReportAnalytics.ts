import type {
  SalesMemberCommercialStatus,
  SalesMemberCommercialSummary,
  TeamSalesGoal,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import type { TeamMember } from '@/features/team/types/team.types'
import type { Timestamp } from 'firebase/firestore'

function getReportTimestamp(report: TeamSalesReport): number {
  return report.reportedAt?.toMillis?.() ?? report.createdAt?.toMillis?.() ?? 0
}

function getValidatedTimestamp(report: TeamSalesReport): Timestamp | null {
  if (report.status !== 'validated') {
    return null
  }

  return report.validatedAt ?? report.updatedAt ?? report.reportedAt ?? report.createdAt ?? null
}

function getLastSaleTimestamp(report: TeamSalesReport): Timestamp | null {
  return report.reportedAt ?? report.createdAt ?? null
}

function isTimestampInCurrentMonth(
  timestamp: Timestamp | null | undefined,
  referenceDate = new Date(),
): boolean {
  const millis = timestamp?.toMillis?.()

  if (typeof millis !== 'number') {
    return false
  }

  const date = new Date(millis)
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  )
}

function resolveNeedsSupport(
  summary: Pick<
    SalesMemberCommercialSummary,
    'reportedCount' | 'pendingCount' | 'totalValidatedCurrentMonth'
  >,
): boolean {
  return (
    summary.reportedCount === 0 ||
    summary.pendingCount > 0 ||
    summary.totalValidatedCurrentMonth === 0
  )
}

function resolveCommercialStatus(
  summary: Pick<
    SalesMemberCommercialSummary,
    | 'reportedCount'
    | 'validatedCount'
    | 'pendingCount'
    | 'contributionPercentage'
    | 'needsSupport'
  >,
): SalesMemberCommercialStatus {
  if (summary.needsSupport) {
    return 'needs_support'
  }

  if (summary.reportedCount === 0 && summary.validatedCount === 0) {
    return 'no_activity'
  }

  if (summary.contributionPercentage >= 25) {
    return 'high_impact'
  }

  if (summary.validatedCount > 0 && summary.contributionPercentage >= 10) {
    return 'good_progress'
  }

  if (summary.pendingCount > 0 || summary.reportedCount > 0) {
    return 'in_motion'
  }

  return 'no_activity'
}

function buildSummaryFromReports(
  memberUid: string,
  memberName: string,
  memberReports: TeamSalesReport[],
  goal: TeamSalesGoal | null,
  referenceDate = new Date(),
  memberEmail?: string,
): SalesMemberCommercialSummary {
  const reportedCount = memberReports.length
  const pendingReports = memberReports.filter((report) => report.status === 'reported')
  const validatedReports = memberReports.filter((report) => report.status === 'validated')
  const pendingCount = pendingReports.length
  const validatedCount = validatedReports.length
  const rejectedCount = memberReports.filter((report) => report.status === 'rejected').length
  const totalReportedAmount = memberReports.reduce((total, report) => total + report.amount, 0)
  const totalValidatedAmount = validatedReports.reduce((total, report) => total + report.amount, 0)
  const totalValidatedCurrentMonth = validatedReports
    .filter((report) => isTimestampInCurrentMonth(getValidatedTimestamp(report), referenceDate))
    .reduce((total, report) => total + report.amount, 0)
  const pendingAmount = pendingReports.reduce((total, report) => total + report.amount, 0)

  const targetAmount = Math.max(goal?.targetAmount ?? 0, 0)
  const contributionPercentage =
    targetAmount > 0 ? Math.min(Math.round((totalValidatedAmount / targetAmount) * 100), 100) : 0

  const lastReportedAt =
    memberReports.reduce<Timestamp | null>((latest, report) => {
      const reportTime = getReportTimestamp(report)

      if (!latest) {
        return getLastSaleTimestamp(report)
      }

      const latestTime = latest.toMillis?.() ?? 0
      return reportTime > latestTime ? getLastSaleTimestamp(report) : latest
    }, null) ?? null

  const lastSaleAt = lastReportedAt
  const needsSupport = resolveNeedsSupport({
    reportedCount,
    pendingCount,
    totalValidatedCurrentMonth,
  })

  const baseSummary = {
    memberUid,
    memberName,
    memberEmail,
    reportedCount,
    pendingCount,
    validatedCount,
    rejectedCount,
    totalReportedAmount,
    totalValidatedAmount,
    totalValidatedCurrentMonth,
    totalValidatedAllTime: totalValidatedAmount,
    pendingAmount,
    contributionPercentage,
    lastReportedAt,
    lastSaleAt,
    needsSupport,
  }

  return {
    ...baseSummary,
    commercialStatus: resolveCommercialStatus(baseSummary),
  }
}

export function sortTeamCommercialProgressSummaries(
  summaries: SalesMemberCommercialSummary[],
): SalesMemberCommercialSummary[] {
  return [...summaries].sort((left, right) => {
    if (right.pendingCount !== left.pendingCount) {
      return right.pendingCount - left.pendingCount
    }

    if (right.totalValidatedCurrentMonth !== left.totalValidatedCurrentMonth) {
      return right.totalValidatedCurrentMonth - left.totalValidatedCurrentMonth
    }

    const leftNoActivity = left.commercialStatus === 'no_activity' ? 1 : 0
    const rightNoActivity = right.commercialStatus === 'no_activity' ? 1 : 0

    if (leftNoActivity !== rightNoActivity) {
      return leftNoActivity - rightNoActivity
    }

    if (right.totalValidatedAllTime !== left.totalValidatedAllTime) {
      return right.totalValidatedAllTime - left.totalValidatedAllTime
    }

    const leftTime = left.lastSaleAt?.toMillis?.() ?? 0
    const rightTime = right.lastSaleAt?.toMillis?.() ?? 0
    return rightTime - leftTime
  })
}

export function buildMemberCommercialSummaries(
  reports: TeamSalesReport[],
  goal: TeamSalesGoal | null,
  referenceDate = new Date(),
): SalesMemberCommercialSummary[] {
  const reportsByMember = new Map<string, TeamSalesReport[]>()

  for (const report of reports) {
    const memberUid = report.memberUid.trim()

    if (!memberUid) {
      continue
    }

    const currentReports = reportsByMember.get(memberUid) ?? []
    currentReports.push(report)
    reportsByMember.set(memberUid, currentReports)
  }

  return sortTeamCommercialProgressSummaries(
    [...reportsByMember.entries()].map(([memberUid, memberReports]) =>
      buildSummaryFromReports(
        memberUid,
        memberReports[0]?.memberName.trim() || 'Miembro del equipo',
        memberReports,
        goal,
        referenceDate,
      ),
    ),
  )
}

export function buildTeamCommercialProgressSummaries(
  reports: TeamSalesReport[],
  goal: TeamSalesGoal | null,
  members: TeamMember[],
  referenceDate = new Date(),
): SalesMemberCommercialSummary[] {
  const reportsByMember = new Map<string, TeamSalesReport[]>()

  for (const report of reports) {
    const memberUid = report.memberUid.trim()

    if (!memberUid) {
      continue
    }

    const currentReports = reportsByMember.get(memberUid) ?? []
    currentReports.push(report)
    reportsByMember.set(memberUid, currentReports)
  }

  const activeMembers = members.filter((member) => member.status === 'active')

  return sortTeamCommercialProgressSummaries(
    activeMembers.map((member) => {
      const memberUid = member.memberUid.trim()
      const memberReports = reportsByMember.get(memberUid) ?? []

      return buildSummaryFromReports(
        memberUid,
        member.memberName?.trim() ||
          memberReports[0]?.memberName.trim() ||
          'Miembro del equipo',
        memberReports,
        goal,
        referenceDate,
        member.memberEmail?.trim() || undefined,
      )
    }),
  )
}

export function buildSingleMemberCommercialSummary(
  reports: TeamSalesReport[],
  memberUid: string,
  memberName: string,
  goal: TeamSalesGoal | null,
  referenceDate = new Date(),
): SalesMemberCommercialSummary {
  const normalizedMemberUid = memberUid.trim()
  const memberReports = reports.filter((report) => report.memberUid.trim() === normalizedMemberUid)

  return buildSummaryFromReports(
    normalizedMemberUid,
    memberName.trim() || memberReports[0]?.memberName.trim() || 'Miembro del equipo',
    memberReports,
    goal,
    referenceDate,
  )
}

export function getCommercialSummaryForMember(
  summaries: SalesMemberCommercialSummary[],
  memberUid: string | null | undefined,
): SalesMemberCommercialSummary | null {
  const normalizedMemberUid = memberUid?.trim()

  if (!normalizedMemberUid) {
    return null
  }

  return summaries.find((summary) => summary.memberUid === normalizedMemberUid) ?? null
}

export function countMembersWithReportedSales(
  summaries: SalesMemberCommercialSummary[],
): number {
  return summaries.filter((summary) => summary.reportedCount > 0).length
}

export const SALES_COMMERCIAL_STATUS_LABELS: Record<SalesMemberCommercialStatus, string> = {
  no_activity: 'Sin actividad',
  in_motion: 'En movimiento',
  good_progress: 'Buen avance',
  high_impact: 'Alto impacto',
  needs_support: 'Necesita acompañamiento',
}
