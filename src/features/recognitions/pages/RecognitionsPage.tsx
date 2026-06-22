import { Award } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { RecentAchievementsSection } from '@/features/recognitions/components/RecentAchievementsSection'
import { LeaderRecognitionQuickPanel } from '@/features/recognitions/components/LeaderRecognitionQuickPanel'
import type { LeaderRecognitionPanelProps } from '@/features/recognitions/components/RecognitionRankingInsights'
import { RecognitionCategoriesGrid } from '@/features/recognitions/components/RecognitionCategoriesGrid'
import { RecognitionHeroCard } from '@/features/recognitions/components/RecognitionHeroCard'
import { RecognitionMonthlyPrizesModal } from '@/features/recognitions/components/RecognitionMonthlyPrizesModal'
import { RecognitionRoleInsightCard } from '@/features/recognitions/components/RecognitionRoleInsightCard'
import { TeamRecognitionsSection } from '@/features/recognitions/components/TeamRecognitionsSection'
import { WeeklyRecognitionSection } from '@/features/recognitions/components/WeeklyRecognitionSection'
import { useRecognitionMonthlyPrizes } from '@/features/recognitions/hooks/useRecognitionMonthlyPrizes'
import { resolveRecognitionsContextForMode } from '@/features/recognitions/utils/recognitionAccess'
import {
  RECOGNITIONS_EMPTY_DESCRIPTION,
  RECOGNITIONS_EMPTY_TITLE,
  RECOGNITIONS_PAGE_HEADER_CLASS,
  RECOGNITIONS_PAGE_SUBTITLE,
  RECOGNITIONS_PAGE_TITLE,
  MONTHLY_PODIUM_PRIZES_COPY,
} from '@/features/recognitions/utils/recognitionCopy'
import { scrollToRecognitionSection } from '@/features/recognitions/utils/recognitionScrollUtils'
import { TeamContextSelector } from '@/features/team/components/TeamContextSelector'
import { TeamContextSwitcher } from '@/features/team/components/TeamContextSwitcher'
import { useTeamContextSelection } from '@/features/team/hooks/useTeamContextSelection'

export function RecognitionsPage() {
  const { appUser, currentUser } = useAuth()
  const { showToast } = useToast()
  const teamContextSelection = useTeamContextSelection()
  const { canAccess, viewRole, teamId, isAdmin } = useMemo(
    () =>
      resolveRecognitionsContextForMode(
        appUser,
        teamContextSelection.mode,
        teamContextSelection.availability,
      ),
    [appUser, teamContextSelection.availability, teamContextSelection.mode],
  )
  const [prizesModalOpen, setPrizesModalOpen] = useState(false)
  const [leaderPanel, setLeaderPanel] = useState<LeaderRecognitionPanelProps>({})

  const {
    prizes,
    loading: prizesLoading,
    saving: prizesSaving,
    savePrizes,
  } = useRecognitionMonthlyPrizes(teamId)

  const canManagePrizes = viewRole === 'leader' || isAdmin
  const ownerUid = currentUser?.uid ?? appUser?.uid ?? ''

  const handleLeaderPanelReady = useCallback((panel: LeaderRecognitionPanelProps) => {
    setLeaderPanel(panel)
  }, [])

  const handleOpenPrizesModal = useCallback(() => {
    setPrizesModalOpen(true)
  }, [])

  const handleSavePrizes = useCallback(
    async (input: { firstPrize: string; secondPrize: string; thirdPrize: string }) => {
      if (!teamId || !ownerUid) {
        throw new Error('Missing team context')
      }

      await savePrizes({
        teamId,
        ownerUid,
        ...input,
      })
      showToast(MONTHLY_PODIUM_PRIZES_COPY.saveSuccess, 'success')
    },
    [ownerUid, savePrizes, showToast, teamId],
  )

  if (teamContextSelection.resolving) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-8 py-8">
        <p className="text-sm text-hero-text/70">Cargando reconocimientos...</p>
      </div>
    )
  }

  if (teamContextSelection.showSelector) {
    return (
      <TeamContextSelector
        availability={teamContextSelection.availability}
        onSelect={teamContextSelection.selectContext}
      />
    )
  }

  if (!canAccess) {
    return (
      <div className="space-y-6 px-8 py-8">
        <PageHeader
          title={RECOGNITIONS_PAGE_TITLE}
          subtitle={RECOGNITIONS_PAGE_SUBTITLE}
          className={RECOGNITIONS_PAGE_HEADER_CLASS}
        />

        <EmptyState
          icon={Award}
          title={RECOGNITIONS_EMPTY_TITLE}
          description={RECOGNITIONS_EMPTY_DESCRIPTION}
          className="border-white/15 bg-white/8 text-hero-text backdrop-blur-xl [&_h3]:text-hero-text [&_p]:text-hero-text/70"
          action={
            <Link to="/dashboard/mi-grupo">
              <Button className="bg-gold text-petrol-deep hover:bg-gold-light">Ir a Mi grupo</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-8 py-8">
      <PageHeader
        title={RECOGNITIONS_PAGE_TITLE}
        subtitle={RECOGNITIONS_PAGE_SUBTITLE}
        className={RECOGNITIONS_PAGE_HEADER_CLASS}
      />

      {teamContextSelection.canSwitch && teamContextSelection.mode ? (
        <TeamContextSwitcher
          mode={teamContextSelection.mode}
          onSwitch={teamContextSelection.clearContext}
        />
      ) : null}

      <RecognitionHeroCard />

      {teamId ? (
        <WeeklyRecognitionSection
          teamId={teamId}
          viewRole={viewRole}
          canManagePrizes={canManagePrizes}
          monthlyPrizes={prizes}
          monthlyPrizesLoading={prizesLoading}
          onOpenPrizesModal={canManagePrizes ? handleOpenPrizesModal : undefined}
          onLeaderPanelReady={viewRole === 'leader' ? handleLeaderPanelReady : undefined}
        />
      ) : null}

      {teamId ? <TeamRecognitionsSection teamId={teamId} viewRole={viewRole} /> : null}

      <RecognitionCategoriesGrid />

      {teamId ? (
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <RecentAchievementsSection teamId={teamId} viewRole={viewRole} />
          {viewRole === 'leader' ? (
            <LeaderRecognitionQuickPanel
              hasPublishedSnapshot={leaderPanel.hasPublishedSnapshot}
              isPublishing={leaderPanel.isPublishing}
              onPublishRanking={leaderPanel.onPublishRanking}
              onConfigurePrizes={canManagePrizes ? handleOpenPrizesModal : undefined}
              onRecognizeMember={() => {
                scrollToRecognitionSection('team-recognitions')
              }}
              onViewRecentAchievements={() => {
                scrollToRecognitionSection('recent-achievements')
              }}
            />
          ) : (
            <RecognitionRoleInsightCard viewRole={viewRole} />
          )}
        </div>
      ) : (
        <RecognitionRoleInsightCard viewRole={viewRole} />
      )}

      {teamId && canManagePrizes ? (
        <RecognitionMonthlyPrizesModal
          open={prizesModalOpen}
          teamId={teamId}
          ownerUid={ownerUid}
          initialPrizes={prizes}
          saving={prizesSaving}
          onClose={() => setPrizesModalOpen(false)}
          onSave={handleSavePrizes}
        />
      ) : null}
    </div>
  )
}
