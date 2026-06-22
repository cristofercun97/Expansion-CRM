import { cn } from '@/lib/utils'

export type MiniWeeklyPodiumEntry = {
  rank: number
  memberName: string
  points: number
}

type MiniWeeklyPodiumProps = {
  entries: MiniWeeklyPodiumEntry[]
  className?: string
}

const PODIUM_ORDER = [2, 1, 3] as const

const PODIUM_META = {
  1: { emoji: '🥇', height: 'h-14', accent: 'border-gold/25 from-gold/10 to-gold/5' },
  2: { emoji: '🥈', height: 'h-10', accent: 'from-white/5 to-white/15' },
  3: { emoji: '🥉', height: 'h-8', accent: 'from-white/5 to-white/15' },
} as const

export function MiniWeeklyPodium({ entries, className }: MiniWeeklyPodiumProps) {
  const entriesByRank = new Map(entries.map((entry) => [entry.rank, entry]))

  return (
    <div className={cn('flex items-end justify-center gap-2 sm:gap-3', className)}>
      {PODIUM_ORDER.map((rank) => {
        const entry = entriesByRank.get(rank)
        const meta = PODIUM_META[rank]

        return (
          <div key={rank} className="flex w-full max-w-[96px] flex-col items-center">
            <span className="text-lg" aria-hidden="true">
              {meta.emoji}
            </span>
            {entry ? (
              <>
                <p className="mt-1 line-clamp-2 text-center text-[11px] font-semibold text-hero-text">
                  {entry.memberName}
                </p>
                <p className="mt-0.5 text-xs font-bold text-teal-accent">{entry.points} pts</p>
              </>
            ) : (
              <p className="mt-1 text-center text-[10px] text-hero-text/45">Por definir</p>
            )}
            <div
              className={cn(
                'mt-2 w-full rounded-t-xl border border-white/15 bg-gradient-to-t',
                meta.height,
                meta.accent,
              )}
            />
          </div>
        )
      })}
    </div>
  )
}
