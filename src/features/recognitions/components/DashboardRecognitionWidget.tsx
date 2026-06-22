import { Loader2, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { MiniWeeklyPodium } from '@/features/recognitions/components/MiniWeeklyPodium'
import { MonthlyPodiumPrizesSection } from '@/features/recognitions/components/MonthlyPodiumPrizesSection'
import { useDashboardRecognitionSnapshot } from '@/features/recognitions/hooks/useDashboardRecognitionSnapshot'
import { useRecognitionMonthlyPrizes } from '@/features/recognitions/hooks/useRecognitionMonthlyPrizes'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { DASHBOARD_WEEKLY_PODIUM_COPY } from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

type DashboardRecognitionWidgetProps = {
  teamId: string
  viewerUid: string
  viewRole: RecognitionsViewRole
  className?: string
}

export function DashboardRecognitionWidget({
  teamId,
  viewerUid,
  viewRole,
  className,
}: DashboardRecognitionWidgetProps) {
  const { topThree, hasPublishedSnapshot, firstPlaceHasCommercialImpact, loading } =
    useDashboardRecognitionSnapshot({
      teamId,
      viewerUid,
      viewRole,
    })
  const { prizes, loading: prizesLoading } = useRecognitionMonthlyPrizes(teamId)

  return (
    <article
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-gold-light" aria-hidden="true" />
        <h2 className="text-base font-semibold text-hero-text">
          {DASHBOARD_WEEKLY_PODIUM_COPY.title}
        </h2>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-hero-text/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando podio...
        </p>
      ) : hasPublishedSnapshot && topThree.length > 0 ? (
        <div className="mt-4 space-y-3">
          <MiniWeeklyPodium entries={topThree} />
          {firstPlaceHasCommercialImpact ? (
            <p className="text-xs leading-relaxed text-teal-accent/90">
              {DASHBOARD_WEEKLY_PODIUM_COPY.commercialImpactActive}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-hero-text/65">
            {DASHBOARD_WEEKLY_PODIUM_COPY.publishedHint}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-hero-text/85">
            {DASHBOARD_WEEKLY_PODIUM_COPY.emptyTitle}
          </p>
          <p className="text-sm leading-relaxed text-hero-text/70">
            {viewRole === 'leader'
              ? DASHBOARD_WEEKLY_PODIUM_COPY.leaderEmptyHint
              : DASHBOARD_WEEKLY_PODIUM_COPY.memberEmptyHint}
          </p>
          <MiniWeeklyPodium entries={[]} />
        </div>
      )}

      <MonthlyPodiumPrizesSection
        prizes={prizes}
        loading={prizesLoading}
        compact
        className="mt-4"
      />

      <Link to="/dashboard/reconocimientos" className="mt-4 block">
        <Button
          type="button"
          className="w-full bg-gold text-petrol-deep hover:bg-gold-light"
        >
          Ver reconocimientos
        </Button>
      </Link>
    </article>
  )
}
