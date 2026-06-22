import { remindersService } from '@/features/reminders/services/reminders.service'
import type { TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import {
  logSalesReportNotificationDebug,
  logSalesReportNotificationWarning,
} from '@/features/sales-goals/utils/salesGoalDebug'
import { formatSalesCurrency } from '@/features/sales-goals/utils/salesGoalUtils'
import { teamService } from '@/features/team/services/team.service'
import { usersService } from '@/services/users.service'

const SALES_REPORT_PLAN_CTA = '/dashboard/plan?context=leader'

export async function createLeaderSalesReportNotification(
  report: TeamSalesReport,
  authUid?: string | null,
): Promise<void> {
  const teamId = report.teamId.trim()

  if (!teamId) {
    logSalesReportNotificationWarning('Missing teamId for sales report notification', {
      authUid: authUid ?? null,
      teamId: null,
      ownerUid: null,
      salesReportId: report.id,
      goalId: report.goalId,
      amount: report.amount,
      currency: report.currency,
    })
    return
  }

  try {
    const team = await teamService.getTeamById(teamId)
    const ownerUid = team?.ownerUid?.trim() || ''

    logSalesReportNotificationDebug({
      authUid: authUid ?? null,
      teamId,
      ownerUid: ownerUid || null,
      salesReportId: report.id,
      goalId: report.goalId,
      amount: report.amount,
      currency: report.currency,
    })

    if (!ownerUid) {
      logSalesReportNotificationWarning('Team owner not found for sales report notification', {
        authUid: authUid ?? null,
        teamId,
        ownerUid: null,
        salesReportId: report.id,
        goalId: report.goalId,
        amount: report.amount,
        currency: report.currency,
      })
      return
    }

    if (ownerUid === report.memberUid) {
      return
    }

    const leaderProfile = await usersService.getUserById(ownerUid).catch(() => null)
    const recipientName = await teamService.getTeamLeaderDisplayName(ownerUid)
    const amountLabel = formatSalesCurrency(report.amount, report.currency)

    await remindersService.createTeamReminder({
      teamId,
      senderUid: report.memberUid,
      senderName: report.memberName,
      recipientUid: ownerUid,
      recipientName,
      recipientEmail: leaderProfile?.email?.trim() || '',
      title: 'Nueva venta reportada',
      message: `${report.memberName} reportó una venta de ${amountLabel}. Revísala para validar el avance del objetivo.`,
      type: 'sales_report',
      relatedContext: {
        source: 'sales_goal',
        salesReportId: report.id,
        goalId: report.goalId,
        amount: report.amount,
        currency: report.currency,
        memberUid: report.memberUid,
        priority: 'high',
        ctaPath: SALES_REPORT_PLAN_CTA,
      },
    })
  } catch (error) {
    logSalesReportNotificationWarning(error, {
      authUid: authUid ?? null,
      teamId,
      ownerUid: null,
      salesReportId: report.id,
      goalId: report.goalId,
      amount: report.amount,
      currency: report.currency,
    })
  }
}
