import { remindersService } from '@/features/reminders/services/reminders.service'
import type {
  TeamSalesGoalHistory,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  logSalesReportNotificationDebug,
  logSalesReportNotificationWarning,
} from '@/features/sales-goals/utils/salesGoalDebug'
import {
  buildSalesGoalPeriodResultMessage,
  formatSalesCurrency,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { teamService } from '@/features/team/services/team.service'
import { usersService } from '@/services/users.service'

const SALES_REPORT_PLAN_CTA = '/dashboard/plan?context=leader'
const SALES_GOAL_RESULT_PLAN_CTA = '/dashboard/plan?context=leader'

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

export async function createSalesGoalPeriodResultNotifications(
  history: TeamSalesGoalHistory,
  options: {
    senderUid: string
    senderName: string
  },
): Promise<void> {
  const teamId = history.teamId.trim()
  const ownerUid = history.ownerUid.trim()
  const senderUid = options.senderUid.trim()
  const senderName = options.senderName.trim() || 'Líder del equipo'

  if (!teamId || !ownerUid || !senderUid) {
    return
  }

  const title =
    history.outcome === 'achieved'
      ? `Objetivo ${history.periodType === 'monthly' ? 'mensual' : 'semanal'} cumplido`
      : `Objetivo ${history.periodType === 'monthly' ? 'mensual' : 'semanal'} no cumplido`

  const message = buildSalesGoalPeriodResultMessage({
    periodLabel: history.periodLabel,
    periodType: history.periodType,
    outcome: history.outcome,
    targetAmount: history.targetAmount,
    finalAmount: history.finalAmount,
    currency: history.currency,
    memberBreakdown: history.memberBreakdown,
  })

  const relatedContext = {
    source: 'sales_goal' as const,
    goalId: history.goalId,
    historyId: history.id,
    amount: history.finalAmount,
    currency: history.currency,
    outcome: history.outcome,
    periodLabel: history.periodLabel,
    priority: history.outcome === 'achieved' ? ('low' as const) : ('high' as const),
    ctaPath: SALES_GOAL_RESULT_PLAN_CTA,
  }

  try {
    const members = await teamService.getTeamMembersByTeamId(teamId, ownerUid)
    const activeMembers = members.filter((member) => member.status === 'active')
    const recipients = new Map<
      string,
      { recipientUid: string; recipientName: string; recipientEmail: string }
    >()

    const leaderProfile = await usersService.getUserById(ownerUid).catch(() => null)
    const leaderName = await teamService.getTeamLeaderDisplayName(ownerUid)

    recipients.set(ownerUid, {
      recipientUid: ownerUid,
      recipientName: leaderName,
      recipientEmail: leaderProfile?.email?.trim() || '',
    })

    await Promise.all(
      activeMembers.map(async (member) => {
        const memberUid = member.memberUid.trim()

        if (!memberUid || recipients.has(memberUid)) {
          return
        }

        const profile = await usersService.getUserById(memberUid).catch(() => null)
        const recipientName =
          member.memberName?.trim() ||
          profile?.displayName?.trim() ||
          profile?.email?.split('@')[0]?.trim() ||
          'Miembro del equipo'

        recipients.set(memberUid, {
          recipientUid: memberUid,
          recipientName,
          recipientEmail: member.memberEmail?.trim() || profile?.email?.trim() || '',
        })
      }),
    )

    await Promise.all(
      [...recipients.values()].map((recipient) =>
        remindersService.createTeamReminder({
          teamId,
          senderUid,
          senderName,
          recipientUid: recipient.recipientUid,
          recipientName: recipient.recipientName,
          recipientEmail: recipient.recipientEmail,
          title,
          message,
          type: 'sales_goal_result',
          relatedContext,
        }),
      ),
    )
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[SalesGoal] period result notifications failed', error)
    }
  }
}
