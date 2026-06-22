import { TrendingUp } from 'lucide-react'
import { LeaderRecognitionQuickPanel } from '@/features/recognitions/components/LeaderRecognitionQuickPanel'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import type { WeeklyRankingEntry } from '@/features/recognitions/types/recognition-ranking.types'
import {
  findMemberRankingEntry,
  getRecognitionMomentumMessage,
  buildSalesRecognitionSummary,
} from '@/features/recognitions/utils/recognitionScoring'
import type { WeeklyRecognitionRanking } from '@/features/recognitions/types/recognition-ranking.types'
import { cn } from '@/lib/utils'

export type LeaderRecognitionPanelProps = {
  hasPublishedSnapshot?: boolean
  isPublishing?: boolean
  onPublishRanking?: () => void
  onConfigurePrizes?: () => void
  onRecognizeMember?: () => void
  onViewRecentAchievements?: () => void
}

type RecognitionRankingInsightsProps = {
  ranking: WeeklyRecognitionRanking | null
  personalEntry?: WeeklyRankingEntry | null
  viewRole: RecognitionsViewRole
  currentMemberUid: string | null
  periodLabel: string
  leaderPanel?: LeaderRecognitionPanelProps
}

export function RecognitionRankingInsights({
  ranking,
  personalEntry = null,
  viewRole,
  currentMemberUid,
  periodLabel,
  leaderPanel,
}: RecognitionRankingInsightsProps) {
  const memberEntry =
    personalEntry ?? (ranking ? findMemberRankingEntry(ranking, currentMemberUid) : null)
  const momentumMessage = ranking
    ? getRecognitionMomentumMessage(ranking.membersWithPointsCount)
    : memberEntry && memberEntry.breakdown.total > 0
      ? 'Tu actividad ya suma puntos esta semana. El podio se publicará cuando tu líder lo comparta.'
      : 'Completa acciones, formación, tareas y ventas validadas para sumar puntos esta semana.'

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-teal-accent/20 bg-teal-accent/5 p-4 backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
            <TrendingUp className="h-5 w-5 text-teal-accent" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-hero-text">Tu equipo está en movimiento</h3>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/75">{momentumMessage}</p>
            <p className="mt-2 text-xs text-hero-text/50">Periodo: {periodLabel}</p>
          </div>
        </div>
      </article>

      {viewRole === 'leader' ? (
        <LeaderRecognitionQuickPanel
          hasPublishedSnapshot={leaderPanel?.hasPublishedSnapshot}
          isPublishing={leaderPanel?.isPublishing}
          onPublishRanking={leaderPanel?.onPublishRanking}
          onConfigurePrizes={leaderPanel?.onConfigurePrizes}
          onRecognizeMember={leaderPanel?.onRecognizeMember}
          onViewRecentAchievements={leaderPanel?.onViewRecentAchievements}
        />
      ) : viewRole === 'member' ? (
        <MemberRankInsightCard entry={memberEntry} showPosition={Boolean(ranking)} />
      ) : null}
    </div>
  )
}

function MemberRankInsightCard({
  entry,
  showPosition = true,
}: {
  entry: WeeklyRankingEntry | null
  showPosition?: boolean
}) {
  const salesSummary = entry ? buildSalesRecognitionSummary(entry.breakdown) : null

  return (
    <article
      className={cn(
        'rounded-2xl border p-4 backdrop-blur-xl sm:p-5',
        entry && entry.breakdown.total > 0
          ? 'border-teal-accent/25 bg-teal-accent/8'
          : 'border-white/15 bg-white/5',
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">
        Tu avance
      </p>
      {entry && entry.breakdown.total > 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-hero-text/80">
          Tu avance esta semana:{' '}
          <span className="font-semibold text-gold-light">{entry.breakdown.total} puntos</span>
          {showPosition && entry.rank > 0 ? (
            <>
              {' '}
              · posición{' '}
              <span className="font-semibold text-teal-accent">#{entry.rank}</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-hero-text/80">
          Todavía puedes sumar puntos completando tu siguiente acción.
        </p>
      )}
      {entry && entry.breakdown.salesPoints > 0 ? (
        <p className="mt-2 text-xs font-medium text-teal-accent">
          Impacto comercial {entry.breakdown.salesPoints} pts
        </p>
      ) : null}
      {salesSummary ? (
        <p className="mt-1 text-xs leading-relaxed text-hero-text/60">{salesSummary}</p>
      ) : null}
    </article>
  )
}
