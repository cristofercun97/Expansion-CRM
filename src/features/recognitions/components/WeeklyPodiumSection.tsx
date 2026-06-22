import { Gift, Trophy } from 'lucide-react'
import { Button } from '@/components/ui'
import { MonthlyPodiumPrizesSection } from '@/features/recognitions/components/MonthlyPodiumPrizesSection'
import type { RecognitionMonthlyPrizes } from '@/features/recognitions/types/recognition-monthly-prizes.types'
import type { WeeklyRankingEntry } from '@/features/recognitions/types/recognition-ranking.types'
import {
  MONTHLY_PODIUM_PRIZES_COPY,
  WEEKLY_PODIUM_COPY,
} from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

const PODIUM_META = [
  { rank: 2, emoji: '🥈', height: 'h-24 sm:h-28' },
  { rank: 1, emoji: '🥇', height: 'h-32 sm:h-36' },
  { rank: 3, emoji: '🥉', height: 'h-20 sm:h-24' },
] as const

type WeeklyPodiumSharedProps = {
  monthlyPrizes?: RecognitionMonthlyPrizes | null
  monthlyPrizesLoading?: boolean
  canManagePrizes?: boolean
  onConfigurePrizes?: () => void
}

type WeeklyPodiumRealProps = WeeklyPodiumSharedProps & {
  podium: WeeklyRankingEntry[]
}

export function WeeklyPodiumReal({
  podium,
  monthlyPrizes = null,
  monthlyPrizesLoading = false,
  canManagePrizes = false,
  onConfigurePrizes,
}: WeeklyPodiumRealProps) {
  const podiumByRank = new Map(podium.map((entry) => [entry.rank, entry]))
  const firstPlace = podiumByRank.get(1)
  const firstPlaceHasCommercialImpact = (firstPlace?.breakdown.salesPoints ?? 0) > 0

  return (
    <article
      id="weekly-podium"
      className="scroll-mt-24 rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6"
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold-light" aria-hidden="true" />
            <h2 className="text-base font-semibold text-hero-text">{WEEKLY_PODIUM_COPY.title}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
            {WEEKLY_PODIUM_COPY.subtitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-hero-text/50">
            {WEEKLY_PODIUM_COPY.salesValidatedHint}
          </p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-hero-text/60">
          Top 3
        </span>
      </div>

      <div className="mt-4 flex items-end justify-center gap-3 sm:gap-5">
        {PODIUM_META.map((slot) => {
          const entry = podiumByRank.get(slot.rank)

          return (
            <div key={slot.rank} className="flex w-full max-w-[140px] flex-col items-center">
              <span className="text-2xl" aria-hidden="true">
                {slot.emoji}
              </span>
              {entry ? (
                <>
                  <p className="mt-2 line-clamp-2 text-center text-xs font-semibold text-hero-text">
                    {entry.memberName}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gold-light">{entry.breakdown.total} pts</p>
                  <p className="mt-2 line-clamp-3 text-center text-[11px] leading-relaxed text-hero-text/55">
                    {entry.activitySummary}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-center text-xs text-hero-text/45">{slot.emoji} Por definir</p>
              )}
              <div
                className={cn(
                  'mt-3 w-full rounded-t-2xl border border-white/15 bg-gradient-to-t from-white/5 to-white/15',
                  slot.height,
                  slot.rank === 1 && 'border-gold/25 from-gold/10 to-gold/5',
                )}
              />
            </div>
          )
        })}
      </div>

      {firstPlaceHasCommercialImpact ? (
        <div className="mt-4 space-y-1 rounded-xl border border-teal-accent/15 bg-teal-accent/5 px-4 py-3">
          <p className="text-sm leading-relaxed text-hero-text/75">
            {WEEKLY_PODIUM_COPY.firstPlaceSalesHint}
          </p>
          <p className="text-xs leading-relaxed text-hero-text/55">
            {WEEKLY_PODIUM_COPY.salesImpactNote}
          </p>
        </div>
      ) : null}

      <div id="monthly-prizes" className="scroll-mt-24 mt-5 space-y-3 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-hero-text/70">
            {WEEKLY_PODIUM_COPY.monthlyPrizesHint}
          </p>
          {canManagePrizes && onConfigurePrizes ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gold/25 bg-gold/5 text-gold-light hover:bg-gold/10"
              onClick={onConfigurePrizes}
            >
              <Gift className="mr-2 h-4 w-4" aria-hidden="true" />
              {monthlyPrizes
                ? MONTHLY_PODIUM_PRIZES_COPY.configureButton
                : MONTHLY_PODIUM_PRIZES_COPY.addButton}
            </Button>
          ) : null}
        </div>

        <MonthlyPodiumPrizesSection
          prizes={monthlyPrizes}
          loading={monthlyPrizesLoading}
        />
      </div>
    </article>
  )
}

export function WeeklyPodiumPlaceholder({
  monthlyPrizes = null,
  monthlyPrizesLoading = false,
  canManagePrizes = false,
  onConfigurePrizes,
}: WeeklyPodiumSharedProps) {
  const orderedPositions = [
    WEEKLY_PODIUM_COPY.positions[1],
    WEEKLY_PODIUM_COPY.positions[0],
    WEEKLY_PODIUM_COPY.positions[2],
  ]

  return (
    <article
      id="weekly-podium"
      className="scroll-mt-24 rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6"
    >
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold-light" aria-hidden="true" />
          <h2 className="text-base font-semibold text-hero-text">{WEEKLY_PODIUM_COPY.title}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
          {WEEKLY_PODIUM_COPY.subtitle}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-center gap-3 sm:gap-4">
        {orderedPositions.map((position) => (
          <div key={position.rank} className="flex w-full max-w-[120px] flex-col items-center">
            <span className="text-2xl" aria-hidden="true">
              {position.emoji}
            </span>
            <p className="mt-2 text-center text-xs font-medium text-hero-text/75">{position.label}</p>
            <div
              className={cn(
                'mt-3 w-full rounded-t-2xl border border-white/15 bg-gradient-to-t from-white/5 to-white/15',
                position.rank === 1 ? 'h-28 border-gold/25 from-gold/10 to-gold/5 sm:h-32' : '',
                position.rank === 2 ? 'h-20 sm:h-24' : '',
                position.rank === 3 ? 'h-16 sm:h-20' : '',
              )}
            />
          </div>
        ))}
      </div>

      <p className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-center text-sm leading-relaxed text-hero-text/65">
        {WEEKLY_PODIUM_COPY.placeholder}
      </p>

      <div id="monthly-prizes" className="scroll-mt-24 mt-5 space-y-3 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-hero-text/70">
            {WEEKLY_PODIUM_COPY.monthlyPrizesHint}
          </p>
          {canManagePrizes && onConfigurePrizes ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gold/25 bg-gold/5 text-gold-light hover:bg-gold/10"
              onClick={onConfigurePrizes}
            >
              <Gift className="mr-2 h-4 w-4" aria-hidden="true" />
              {monthlyPrizes
                ? MONTHLY_PODIUM_PRIZES_COPY.configureButton
                : MONTHLY_PODIUM_PRIZES_COPY.addButton}
            </Button>
          ) : null}
        </div>

        <MonthlyPodiumPrizesSection
          prizes={monthlyPrizes}
          loading={monthlyPrizesLoading}
        />
      </div>
    </article>
  )
}

export function getFirstPlaceFromPodium(podium: WeeklyRankingEntry[]): WeeklyRankingEntry | null {
  const firstPlace = podium.find((entry) => entry.rank === 1) ?? podium[0] ?? null

  if (!firstPlace || firstPlace.breakdown.total <= 0) {
    return null
  }

  return firstPlace
}
