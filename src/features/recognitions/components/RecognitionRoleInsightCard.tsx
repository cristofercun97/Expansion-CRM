import { Crown, Star } from 'lucide-react'
import type { RecognitionsViewRole } from '@/features/recognitions/utils/recognitionAccess'
import { LEADER_INSIGHT, MEMBER_INSIGHT } from '@/features/recognitions/utils/recognitionCopy'
import { cn } from '@/lib/utils'

type RecognitionRoleInsightCardProps = {
  viewRole: RecognitionsViewRole
}

export function RecognitionRoleInsightCard({ viewRole }: RecognitionRoleInsightCardProps) {
  if (viewRole === 'none') {
    return null
  }

  const isLeader = viewRole === 'leader'
  const copy = isLeader ? LEADER_INSIGHT : MEMBER_INSIGHT
  const Icon = isLeader ? Crown : Star

  return (
    <article
      className={cn(
        'rounded-2xl border p-5 backdrop-blur-xl sm:p-6',
        isLeader
          ? 'border-gold/25 bg-gradient-to-br from-gold/10 via-white/8 to-transparent'
          : 'border-teal-accent/25 bg-gradient-to-br from-teal-accent/8 via-white/8 to-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            isLeader
              ? 'border-gold/25 bg-gold/10 text-gold-light'
              : 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">
            {copy.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-hero-text/80">{copy.message}</p>
        </div>
      </div>
    </article>
  )
}
