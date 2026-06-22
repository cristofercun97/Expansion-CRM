import { Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SalesGoalModal, SalesReportModal } from '@/features/sales-goals/components/SalesGoalModals'
import {
  SalesGoalEmptyState,
  SalesGoalLoadingState,
  SalesGoalProgressBar,
  SalesGoalStatusBadge,
} from '@/features/sales-goals/components/SalesGoalShared'
import { useTeamSalesGoal, useTeamSalesGoalActions } from '@/features/sales-goals/hooks/useTeamSalesGoal'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import {
  formatSalesCurrency,
  resolveDashboardSalesTeamContext,
  SALES_GOAL_COPY,
} from '@/features/sales-goals/utils/salesGoalUtils'
import {
  buildMemberCommercialSummaries,
  buildSingleMemberCommercialSummary,
  countMembersWithReportedSales,
} from '@/features/sales-goals/utils/salesReportAnalytics'
import { cn } from '@/lib/utils'

type DashboardSalesGoalWidgetProps = {
  className?: string
}

export function DashboardSalesGoalWidget({ className }: DashboardSalesGoalWidgetProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { appUser, currentUser } = useAuth()
  const authUid = currentUser?.uid ?? null
  const { teamId, isLeader } = useMemo(
    () => resolveDashboardSalesTeamContext(appUser),
    [appUser],
  )
  const viewerUid = authUid ?? appUser?.uid ?? null
  const memberName =
    appUser?.displayName?.trim() ||
    currentUser?.displayName?.trim() ||
    currentUser?.email?.split('@')[0] ||
    'Miembro del equipo'

  const loadDebugContext = useMemo(
    () => ({
      authUid: currentUser?.uid ?? null,
      authEmail: currentUser?.email ?? appUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? false,
      appUserUid: appUser?.uid ?? null,
      appUserRole: appUser?.role ?? null,
      activationStatus: appUser?.activationStatus ?? null,
      homeTeamId: appUser?.homeTeamId ?? null,
      ownedTeamId: appUser?.ownedTeamId ?? null,
      contextMode: isLeader ? 'leader' : 'member',
      effectiveTeamId: teamId,
    }),
    [
      appUser?.activationStatus,
      appUser?.email,
      appUser?.homeTeamId,
      appUser?.ownedTeamId,
      appUser?.role,
      appUser?.uid,
      currentUser?.email,
      currentUser?.emailVerified,
      currentUser?.uid,
      isLeader,
      teamId,
    ],
  )

  const { goal, progress, loading, reload, pendingReports, reports } = useTeamSalesGoal({
    teamId,
    viewerUid,
    isLeader,
    enabled: Boolean(teamId),
    loadDebugContext,
  })
  const { saving, wrapAction } = useTeamSalesGoalActions(reload)

  const leaderCommercialStats = useMemo(() => {
    if (!isLeader || !goal) {
      return null
    }

    const summaries = buildMemberCommercialSummaries(reports, goal)

    return {
      membersWithSales: countMembersWithReportedSales(summaries),
      pendingCount: pendingReports.length,
    }
  }, [goal, isLeader, pendingReports.length, reports])

  const memberValidatedSummary = useMemo(() => {
    if (isLeader || !goal || !viewerUid) {
      return null
    }

    return buildSingleMemberCommercialSummary(reports, viewerUid, memberName, goal)
  }, [goal, isLeader, memberName, reports, viewerUid])

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const planLink = isLeader ? '/dashboard/plan?context=leader' : '/dashboard/plan?context=member'
  const pendingReportsCount = pendingReports.length

  if (!teamId) {
    return null
  }

  async function handleSaveGoal(input: {
    periodType: 'weekly' | 'monthly'
    targetAmount: number
    currency: 'EUR' | 'USD'
    description?: string | null
  }) {
    if (!viewerUid) {
      throw new Error('Missing viewer')
    }

    await wrapAction(async () => {
      await salesGoalService.upsertGoal(
        {
          teamId: teamId!,
          ownerUid: viewerUid,
          ...input,
        },
        {
          authUid: currentUser?.uid ?? null,
          authEmail: currentUser?.email ?? appUser?.email ?? null,
          emailVerified: currentUser?.emailVerified ?? false,
          appUserUid: appUser?.uid ?? null,
          appUserRole: appUser?.role ?? null,
          activationStatus: appUser?.activationStatus ?? null,
          homeTeamId: appUser?.homeTeamId ?? null,
          ownedTeamId: appUser?.ownedTeamId ?? null,
          contextMode: isLeader ? 'leader' : 'member',
          effectiveTeamId: teamId,
        },
      )
      showToast(SALES_GOAL_COPY.goalSaved, 'success')
    })
  }

  async function handleReportSale(input: { amount: number; note?: string | null }) {
    if (!authUid || !goal || goal.status !== 'active') {
      throw new Error(SALES_GOAL_COPY.noActiveGoalReport)
    }

    const reportTeamId = goal.teamId.trim() || teamId!.trim()

    await wrapAction(async () => {
      await salesGoalService.createReport(
        {
          teamId: reportTeamId,
          goalId: goal.id,
          memberUid: authUid,
          memberName,
          amount: input.amount,
          currency: goal.currency,
          note: input.note,
        },
        {
          goal,
          debugContext: {
            ...loadDebugContext,
            authUid,
            goalId: goal.id,
            goalTeamId: goal.teamId,
            goalStatus: goal.status,
            effectiveTeamId: reportTeamId,
          },
        },
      )
      showToast(SALES_GOAL_COPY.reportSuccess, 'success')
    })
  }

  return (
    <article
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-gold-light" aria-hidden="true" />
        <h2 className="text-base font-semibold text-hero-text">{SALES_GOAL_COPY.title}</h2>
      </div>

      {loading ? (
        <SalesGoalLoadingState compact />
      ) : !goal || !progress ? (
        <div className="mt-4">
          <SalesGoalEmptyState
            compact
            isLeader={isLeader}
            onConfigure={isLeader ? () => setGoalModalOpen(true) : undefined}
            onGoToPlan={() => navigate(planLink)}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-hero-text/70">{goal.periodLabel}</p>
            <SalesGoalStatusBadge label={progress.statusLabel} status={progress.status} />
          </div>

          <p className="text-sm text-hero-text/75">
            Meta:{' '}
            <span className="font-semibold text-gold-light">
              {formatSalesCurrency(progress.targetAmount, goal.currency)}
            </span>
          </p>

          <SalesGoalProgressBar progress={progress} currency={goal.currency} compact />

          {isLeader && leaderCommercialStats ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-hero-text/75">
              <p>{SALES_GOAL_COPY.dashboardMembersWithSales(leaderCommercialStats.membersWithSales)}</p>
              {leaderCommercialStats.pendingCount > 0 ? (
                <p className="mt-1 text-gold-light">
                  {SALES_GOAL_COPY.pendingSalesBadge(leaderCommercialStats.pendingCount)}
                </p>
              ) : null}
            </div>
          ) : null}

          {!isLeader && memberValidatedSummary ? (
            <p className="text-sm text-hero-text/75">
              {SALES_GOAL_COPY.dashboardMemberValidatedProgress(
                formatSalesCurrency(memberValidatedSummary.totalValidatedAmount, goal.currency),
              )}
            </p>
          ) : null}

          {isLeader && pendingReportsCount > 0 ? (
            <div className="rounded-xl border border-gold/25 bg-gold/8 px-3 py-3">
              <p className="text-sm font-medium text-gold-light">
                {SALES_GOAL_COPY.pendingSalesBadge(pendingReportsCount)}
              </p>
              <Link to={planLink} className="mt-3 block">
                <Button
                  type="button"
                  className="w-full bg-gold text-petrol-deep hover:bg-gold-light"
                >
                  {SALES_GOAL_COPY.reviewPendingSalesButton}
                </Button>
              </Link>
            </div>
          ) : null}

          {isLeader ? (
            <Link to={planLink} className="block">
              <Button
                type="button"
                className="mt-1 w-full bg-gold text-petrol-deep hover:bg-gold-light"
              >
                {SALES_GOAL_COPY.dashboardLeaderCta}
              </Button>
            </Link>
          ) : (
            <Button
              type="button"
              className="mt-1 w-full bg-gold text-petrol-deep hover:bg-gold-light"
              disabled={!goal || goal.status !== 'active'}
              title={
                !goal || goal.status !== 'active'
                  ? SALES_GOAL_COPY.noActiveGoalReport
                  : undefined
              }
              onClick={() => setReportModalOpen(true)}
            >
              {SALES_GOAL_COPY.dashboardMemberCta}
            </Button>
          )}
        </div>
      )}

      {isLeader ? (
        <SalesGoalModal
          open={goalModalOpen}
          initialGoal={goal}
          saving={saving}
          onClose={() => setGoalModalOpen(false)}
          onSave={handleSaveGoal}
        />
      ) : null}

      {!isLeader && goal ? (
        <SalesReportModal
          open={reportModalOpen}
          currency={goal.currency}
          saving={saving}
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleReportSale}
        />
      ) : null}
    </article>
  )
}
