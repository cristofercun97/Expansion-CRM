import { Gift, Loader2 } from 'lucide-react'
import type { RecognitionMonthlyPrizes } from '@/features/recognitions/types/recognition-monthly-prizes.types'
import { MONTHLY_PODIUM_PRIZES_COPY } from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

type MonthlyPodiumPrizesSectionProps = {
  prizes: RecognitionMonthlyPrizes | null
  loading?: boolean
  compact?: boolean
  className?: string
  id?: string
}

const PRIZE_SLOTS = [
  {
    rank: 1,
    emoji: '🥇',
    label: MONTHLY_PODIUM_PRIZES_COPY.firstLabel,
    key: 'firstPrize' as const,
    accent: 'border-gold/30 bg-gold/10 text-gold-light',
  },
  {
    rank: 2,
    emoji: '🥈',
    label: MONTHLY_PODIUM_PRIZES_COPY.secondLabel,
    key: 'secondPrize' as const,
    accent: 'border-white/20 bg-white/8 text-hero-text/85',
  },
  {
    rank: 3,
    emoji: '🥉',
    label: MONTHLY_PODIUM_PRIZES_COPY.thirdLabel,
    key: 'thirdPrize' as const,
    accent: 'border-white/15 bg-white/5 text-hero-text/75',
  },
] as const

export function MonthlyPodiumPrizesSection({
  prizes,
  loading = false,
  compact = false,
  className,
  id,
}: MonthlyPodiumPrizesSectionProps) {
  const hasConfiguredPrizes = Boolean(
    prizes &&
      (prizes.firstPrize || prizes.secondPrize || prizes.thirdPrize),
  )

  return (
    <section
      id={id}
      className={cn(
        'rounded-xl border border-gold/20 bg-gradient-to-br from-gold/8 via-white/5 to-transparent backdrop-blur-xl',
        compact ? 'px-3 py-3' : 'px-4 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
          <Gift className="h-4 w-4 text-gold-light" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/85">
            {compact ? MONTHLY_PODIUM_PRIZES_COPY.compactTitle : MONTHLY_PODIUM_PRIZES_COPY.title}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs leading-relaxed text-hero-text/65">
              {MONTHLY_PODIUM_PRIZES_COPY.description}
            </p>
          ) : null}

          {loading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-hero-text/70">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando premios...
            </p>
          ) : hasConfiguredPrizes ? (
            <ul className={cn('flex flex-col gap-2', compact ? 'mt-2' : 'mt-3')}>
              {PRIZE_SLOTS.map((slot) => {
                const prizeText = prizes?.[slot.key]?.trim()

                return (
                  <li
                    key={slot.rank}
                    className={cn(
                      'rounded-lg border px-3 py-2.5',
                      slot.accent,
                      compact && 'py-2',
                    )}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                      {slot.emoji} {slot.label}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug">
                      {prizeText || MONTHLY_PODIUM_PRIZES_COPY.emptySlot}
                    </p>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
              {MONTHLY_PODIUM_PRIZES_COPY.unconfigured}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
