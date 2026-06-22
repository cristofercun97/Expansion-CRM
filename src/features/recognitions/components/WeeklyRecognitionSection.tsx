import { useCallback, useEffect, useMemo } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { MonthlyMvpSection } from '@/features/recognitions/components/MonthlyMvpSection'
import { RecognitionRankingInsights } from '@/features/recognitions/components/RecognitionRankingInsights'
import type { LeaderRecognitionPanelProps } from '@/features/recognitions/components/RecognitionRankingInsights'
import {
  WeeklyPodiumPlaceholder,
  WeeklyPodiumReal,
} from '@/features/recognitions/components/WeeklyPodiumSection'
import { WeeklyRankingList } from '@/features/recognitions/components/WeeklyRankingList'
import { useWeeklyRecognitionRanking } from '@/features/recognitions/hooks/useWeeklyRecognitionRanking'
import type { RecognitionMonthlyPrizes } from '@/features/recognitions/types/recognition-monthly-prizes.types'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { scrollToRecognitionSection } from '@/features/recognitions/utils/recognitionScrollUtils'
import {
  LEADER_PUBLISH_RANKING_LABEL,
  LEADER_UPDATE_RANKING_LABEL,
  MEMBER_UNPUBLISHED_RANKING_MESSAGE,
  MEMBER_UNPUBLISHED_RANKING_MOTIVATION,
  MEMBER_UNPUBLISHED_RANKING_TITLE,
} from '@/features/recognitions/utils/recognitionWeeklySnapshotUtils'

type WeeklyRecognitionSectionProps = {
  teamId: string
  viewRole: RecognitionsViewRole
  canManagePrizes?: boolean
  monthlyPrizes?: RecognitionMonthlyPrizes | null
  monthlyPrizesLoading?: boolean
  onOpenPrizesModal?: () => void
  onLeaderPanelReady?: (panel: LeaderRecognitionPanelProps) => void
}

export function WeeklyRecognitionSection({
  teamId,
  viewRole,
  canManagePrizes = false,
  monthlyPrizes = null,
  monthlyPrizesLoading = false,
  onOpenPrizesModal,
  onLeaderPanelReady,
}: WeeklyRecognitionSectionProps) {
  const { currentUser } = useAuth()
  const {
    ranking,
    personalEntry,
    rankingSource,
    hasPublishedSnapshot,
    periodLabel,
    loading,
    error,
    publishing,
    publishError,
    publishSuccess,
    publishRanking,
  } = useWeeklyRecognitionRanking(teamId, {
    viewRole,
    memberUid: currentUser?.uid ?? null,
  })

  const handlePublishRanking = useCallback(() => {
    void publishRanking()
  }, [publishRanking])

  const handleRecognizeMember = useCallback(() => {
    scrollToRecognitionSection('team-recognitions')
  }, [])

  const handleViewRecentAchievements = useCallback(() => {
    scrollToRecognitionSection('recent-achievements')
  }, [])

  const leaderPanel = useMemo<LeaderRecognitionPanelProps | undefined>(
    () =>
      viewRole === 'leader'
        ? {
            hasPublishedSnapshot,
            isPublishing: publishing,
            onPublishRanking: handlePublishRanking,
            onConfigurePrizes: onOpenPrizesModal,
            onRecognizeMember: handleRecognizeMember,
            onViewRecentAchievements: handleViewRecentAchievements,
          }
        : undefined,
    [
      handlePublishRanking,
      handleRecognizeMember,
      handleViewRecentAchievements,
      hasPublishedSnapshot,
      onOpenPrizesModal,
      publishing,
      viewRole,
    ],
  )

  useEffect(() => {
    if (!onLeaderPanelReady) {
      return
    }

    onLeaderPanelReady(leaderPanel ?? {})
  }, [leaderPanel, onLeaderPanelReady])

  const podiumProps = {
    monthlyPrizes,
    monthlyPrizesLoading,
    canManagePrizes,
    onConfigurePrizes: onOpenPrizesModal,
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/8 px-5 py-8 backdrop-blur-xl">
        <p className="flex items-center justify-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Calculando ranking semanal...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <WeeklyPodiumPlaceholder {...podiumProps} />
          <MonthlyMvpSection teamId={teamId} viewRole={viewRole} />
        </div>
      </div>
    )
  }

  if (viewRole === 'member' && rankingSource === 'none') {
    return (
      <div className="space-y-5">
        <MemberUnpublishedRankingCard periodLabel={periodLabel} />

        <div className="grid gap-5 lg:grid-cols-2">
          <WeeklyPodiumPlaceholder {...podiumProps} />
          <MonthlyMvpSection teamId={teamId} viewRole={viewRole} />
        </div>

        <RecognitionRankingInsights
          ranking={null}
          personalEntry={personalEntry}
          viewRole={viewRole}
          currentMemberUid={currentUser?.uid ?? null}
          periodLabel={periodLabel}
        />
      </div>
    )
  }

  if (!ranking) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <WeeklyPodiumPlaceholder {...podiumProps} />
        <MonthlyMvpSection teamId={teamId} viewRole={viewRole} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {viewRole === 'leader' ? (
        <LeaderPublishRankingBar
          hasPublishedSnapshot={hasPublishedSnapshot}
          publishing={publishing}
          publishError={publishError}
          publishSuccess={publishSuccess}
          onPublish={() => {
            handlePublishRanking()
          }}
        />
      ) : null}

      {ranking.loadWarnings.length > 0 ? (
        <div className="space-y-2">
          {ranking.loadWarnings.map((warning) => (
            <p
              key={warning}
              className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-gold-light"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {ranking.hasActivity ? (
          <WeeklyPodiumReal podium={ranking.podium} {...podiumProps} />
        ) : (
          <WeeklyPodiumPlaceholder {...podiumProps} />
        )}
        <MonthlyMvpSection teamId={teamId} viewRole={viewRole} />
      </div>

      <RecognitionRankingInsights
        ranking={ranking}
        personalEntry={personalEntry}
        viewRole={viewRole}
        currentMemberUid={currentUser?.uid ?? null}
        periodLabel={ranking.period.label}
        leaderPanel={leaderPanel}
      />

      {ranking.hasActivity ? <WeeklyRankingList entries={ranking.entries} /> : null}
    </div>
  )
}

function MemberUnpublishedRankingCard({ periodLabel }: { periodLabel: string }) {
  return (
    <article className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">
        {MEMBER_UNPUBLISHED_RANKING_TITLE}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-hero-text/80">
        {MEMBER_UNPUBLISHED_RANKING_MESSAGE}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-teal-accent/90">
        {MEMBER_UNPUBLISHED_RANKING_MOTIVATION}
      </p>
      <p className="mt-3 text-xs text-hero-text/50">Periodo: {periodLabel}</p>
    </article>
  )
}

type LeaderPublishRankingBarProps = {
  hasPublishedSnapshot: boolean
  publishing: boolean
  publishError: string
  publishSuccess: string
  onPublish: () => void
}

function LeaderPublishRankingBar({
  hasPublishedSnapshot,
  publishing,
  publishError,
  publishSuccess,
  onPublish,
}: LeaderPublishRankingBarProps) {
  return (
    <div
      id="weekly-podium-publish"
      className="scroll-mt-24 rounded-2xl border border-gold/20 bg-gold/5 p-4 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-hero-text">Ranking en vivo del equipo</p>
          <p className="mt-1 text-sm text-hero-text/70">
            Publica el ranking para que tus miembros vean el podio sin exponer datos privados.
          </p>
        </div>

        <Button
          type="button"
          className="shrink-0 bg-gold text-petrol-deep hover:bg-gold-light"
          disabled={publishing}
          onClick={onPublish}
        >
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Publicando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              {hasPublishedSnapshot ? LEADER_UPDATE_RANKING_LABEL : LEADER_PUBLISH_RANKING_LABEL}
            </>
          )}
        </Button>
      </div>

      {publishError ? (
        <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {publishError}
        </p>
      ) : null}

      {publishSuccess ? (
        <p className="mt-3 rounded-xl border border-teal-accent/25 bg-teal-accent/10 px-4 py-3 text-sm text-teal-accent">
          {publishSuccess}
        </p>
      ) : null}
    </div>
  )
}
