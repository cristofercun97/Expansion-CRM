import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SalesGoalModal, SalesReportModal } from '@/features/sales-goals/components/SalesGoalModals'
import {
  SalesGoalEmptyState,
  SalesGoalHeader,
  SalesGoalLoadingState,
  SalesGoalMetricRow,
  SalesGoalProgressBar,
  SalesGoalStatusBadge,
} from '@/features/sales-goals/components/SalesGoalShared'
import { SalesReportsReviewSection } from '@/features/sales-goals/components/SalesReportsReviewSection'
import { SalesMemberCommercialReportSection } from '@/features/sales-goals/components/SalesMemberCommercialReportSection'
import { MemberSalesSummaryCard } from '@/features/sales-goals/components/MemberSalesSummaryCard'
import { TeamSalesProgressModal } from '@/features/sales-goals/components/TeamSalesProgressModal'
import { useTeamSalesGoal, useTeamSalesGoalActions } from '@/features/sales-goals/hooks/useTeamSalesGoal'
import { salesGoalService } from '@/features/sales-goals/services/sales-goal.service'
import { buildSingleMemberCommercialSummary } from '@/features/sales-goals/utils/salesReportAnalytics'
import { SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { teamService } from '@/features/team/services/team.service'
import type { TeamMember } from '@/features/team/types/team.types'
import { cn } from '@/lib/utils'

type SalesGoalCardProps = {
  teamId: string
  isLeader: boolean
  contextQuery?: string
  className?: string
}

export function SalesGoalCard({
  teamId,
  isLeader,
  contextQuery,
  className,
}: SalesGoalCardProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { currentUser, appUser } = useAuth()
  const authUid = currentUser?.uid ?? null
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
      contextMode: contextQuery ?? null,
      effectiveTeamId: teamId,
    }),
    [
      appUser?.activationStatus,
      appUser?.email,
      appUser?.homeTeamId,
      appUser?.ownedTeamId,
      appUser?.role,
      appUser?.uid,
      contextQuery,
      currentUser?.email,
      currentUser?.emailVerified,
      currentUser?.uid,
      teamId,
    ],
  )

  const { goal, reports, pendingReports, progress, loading, error, reload } = useTeamSalesGoal({
    teamId,
    viewerUid,
    isLeader,
    loadDebugContext,
  })
  const { saving, wrapAction } = useTeamSalesGoalActions(reload)

  const memberCommercialSummary = useMemo(() => {
    if (isLeader || !viewerUid || !goal) {
      return null
    }

    return buildSingleMemberCommercialSummary(reports, viewerUid, memberName, goal)
  }, [goal, isLeader, memberName, reports, viewerUid])

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [salesProgressModalOpen, setSalesProgressModalOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showReports, setShowReports] = useState(false)
  const [processingReportId, setProcessingReportId] = useState<string | null>(null)

  const planLink = useMemo(() => {
    const params = new URLSearchParams()
    if (contextQuery) {
      params.set('context', contextQuery)
    }
    const query = params.toString()
    return query ? `/dashboard/plan?${query}` : '/dashboard/plan'
  }, [contextQuery])

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
      try {
        await salesGoalService.upsertGoal(
          {
            teamId,
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
            contextMode: contextQuery ?? null,
            effectiveTeamId: teamId,
          },
        )
        showToast(SALES_GOAL_COPY.goalSaved, 'success')
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[SalesGoalCard] save failed', error)
        }
        throw error
      }
    })
  }

  async function handleReportSale(input: { amount: number; note?: string | null }) {
    if (!authUid || !goal || goal.status !== 'active') {
      throw new Error(SALES_GOAL_COPY.noActiveGoalReport)
    }

    const reportTeamId = goal.teamId.trim() || teamId.trim()

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

  async function handleValidate(reportId: string) {
    if (!viewerUid) {
      return
    }

    setProcessingReportId(reportId)

    try {
      await salesGoalService.updateReportStatus(reportId, 'validated', viewerUid)
      await reload()
      showToast(SALES_GOAL_COPY.validateSuccess, 'success')
    } finally {
      setProcessingReportId(null)
    }
  }

  async function handleReject(reportId: string) {
    if (!viewerUid) {
      return
    }

    setProcessingReportId(reportId)

    try {
      await salesGoalService.updateReportStatus(reportId, 'rejected', viewerUid)
      await reload()
      showToast(SALES_GOAL_COPY.rejectSuccess, 'success')
    } finally {
      setProcessingReportId(null)
    }
  }

  async function handleOpenSalesProgressModal() {
    if (!goal) {
      return
    }

    try {
      const members = await teamService.getTeamMembersByTeamId(teamId, goal.ownerUid)
      setTeamMembers(members)
      setSalesProgressModalOpen(true)
    } catch (loadError) {
      if (import.meta.env.DEV) {
        console.error('[SalesGoalCard] Failed to load team members for sales progress', loadError)
      }

      showToast('No pudimos cargar el progreso comercial del equipo.', 'info')
    }
  }

  return (
    <article
      id="sales-progress"
      className={cn(
        'rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/8 via-white/8 to-teal-accent/5 p-5 backdrop-blur-xl sm:p-6',
        className,
      )}
    >
      <SalesGoalHeader
        title={isLeader ? SALES_GOAL_COPY.title : SALES_GOAL_COPY.memberTitle}
        description={isLeader ? SALES_GOAL_COPY.description : SALES_GOAL_COPY.memberMotivation}
      />

      {loading ? (
        <SalesGoalLoadingState />
      ) : error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : !goal || !progress ? (
        <div className="mt-4">
          <SalesGoalEmptyState
            isLeader={isLeader}
            onConfigure={isLeader ? () => setGoalModalOpen(true) : undefined}
            onGoToPlan={!isLeader ? () => navigate(planLink) : undefined}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SalesGoalStatusBadge label={progress.statusLabel} status={progress.status} />
            {goal.description ? (
              <p className="text-sm text-hero-text/65">{goal.description}</p>
            ) : null}
          </div>

          <SalesGoalMetricRow goal={goal} progress={progress} />
          <SalesGoalProgressBar progress={progress} currency={goal.currency} />

          {isLeader && pendingReports.length > 0 ? (
            <div className="rounded-xl border border-gold/25 bg-gold/8 px-4 py-3">
              <p className="text-sm font-medium text-gold-light">
                {SALES_GOAL_COPY.pendingSalesBadge(pendingReports.length)}
              </p>
              <p className="mt-1 text-xs text-hero-text/70">
                {SALES_GOAL_COPY.pendingSalesLeaderNotice}
              </p>
            </div>
          ) : null}

          {isLeader ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-gold text-petrol-deep hover:bg-gold-light"
                onClick={() => setGoalModalOpen(true)}
              >
                {SALES_GOAL_COPY.configureButton}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
                onClick={() => setShowReports((current) => !current)}
              >
                {SALES_GOAL_COPY.viewReportsButton}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-teal-accent/25 bg-teal-accent/5 text-teal-accent hover:bg-teal-accent/10"
                onClick={() => void handleOpenSalesProgressModal()}
              >
                {SALES_GOAL_COPY.teamSalesProgressButton}
              </Button>
              {pendingReports.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-gold/25 bg-gold/5 text-gold-light hover:bg-gold/10"
                  onClick={() => setShowReports(true)}
                >
                  {SALES_GOAL_COPY.validatePendingButton} ({pendingReports.length})
                </Button>
              ) : null}
            </div>
          ) : null}

          {isLeader && showReports ? (
            <SalesReportsReviewSection
              reports={reports}
              processingReportId={processingReportId}
              onValidate={handleValidate}
              onReject={handleReject}
            />
          ) : null}

          {isLeader && goal ? (
            <SalesMemberCommercialReportSection goal={goal} reports={reports} />
          ) : null}

          {!isLeader && goal && memberCommercialSummary ? (
            <MemberSalesSummaryCard
              summary={memberCommercialSummary}
              goal={goal}
              disableReport={goal.status !== 'active'}
              onReportSale={() => setReportModalOpen(true)}
            />
          ) : null}
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

      {isLeader ? (
        <TeamSalesProgressModal
          open={salesProgressModalOpen}
          goal={goal}
          reports={reports}
          members={teamMembers}
          onClose={() => setSalesProgressModalOpen(false)}
        />
      ) : null}
    </article>
  )
}
