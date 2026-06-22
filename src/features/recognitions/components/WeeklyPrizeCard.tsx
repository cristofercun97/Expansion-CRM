import { Gift } from 'lucide-react'
import type { WeeklyRankingEntry } from '@/features/recognitions/types/recognition-ranking.types'
import { cn } from '@/lib/utils'

export const WEEKLY_PRIZE_COPY = {
  title: 'Premio del podio',
  description: 'El primer lugar de la semana queda destacado como referente del equipo.',
  leaderLine: (name: string, points: number) =>
    `Esta semana: ${name} lidera con ${points} puntos.`,
  openPrize: 'El premio está abierto. Completa acciones para competir por el primer lugar.',
  activeBadge: 'Premio del podio activo',
}

export const MONTHLY_MAIN_PRIZE_COPY = {
  title: 'Premio principal del mes',
  winnerLine: (name: string) => `${name} lidera la carrera por el premio principal del mes.`,
  inactive:
    'El premio principal se activará cuando haya rankings semanales publicados.',
  provisionalTitle: 'MVP provisional del mes',
  definitiveTitle: 'MVP del mes',
  provisionalBadge: 'Ganador provisional',
  mainPrizeBadge: 'Premio principal',
}

export function getFirstPlaceFromPodium(podium: WeeklyRankingEntry[]): WeeklyRankingEntry | null {
  const firstPlace = podium.find((entry) => entry.rank === 1) ?? podium[0] ?? null

  if (!firstPlace || firstPlace.breakdown.total <= 0) {
    return null
  }

  return firstPlace
}

type WeeklyPrizeCardProps = {
  firstPlaceName?: string | null
  points?: number | null
  className?: string
  compact?: boolean
}

export function WeeklyPrizeCard({
  firstPlaceName,
  points,
  className,
  compact = false,
}: WeeklyPrizeCardProps) {
  const hasWinner = Boolean(firstPlaceName && points && points > 0)

  return (
    <div
      className={cn(
        'rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 via-white/5 to-transparent backdrop-blur-xl',
        compact ? 'px-3 py-3' : 'mt-5 px-4 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
          <Gift className="h-4 w-4 text-gold-light" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/85">
            {WEEKLY_PRIZE_COPY.title}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs leading-relaxed text-hero-text/65">
              {WEEKLY_PRIZE_COPY.description}
            </p>
          ) : null}
          <p
            className={cn(
              'text-sm leading-relaxed',
              hasWinner ? 'mt-2 font-medium text-hero-text/85' : 'mt-1 text-hero-text/70',
            )}
          >
            {hasWinner
              ? WEEKLY_PRIZE_COPY.leaderLine(firstPlaceName!, points!)
              : WEEKLY_PRIZE_COPY.openPrize}
          </p>
        </div>
      </div>
    </div>
  )
}
