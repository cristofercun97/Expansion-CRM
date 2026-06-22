import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TeamActionMapReview } from '@/features/action-plan/types/team-action-map-review.types'
import {
  getWeeklyReviewStatusBadgeClassName,
  getWeeklyReviewStatusDotClassName,
  getWeeklyReviewStatusLabel,
} from '@/features/action-plan/utils/teamActionMapReviewUtils'
import { cn } from '@/lib/utils'

type MemberWeeklyReviewCardProps = {
  review: TeamActionMapReview | null
}

function truncateReviewText(value: string, maxLength = 140): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

function WeeklyReviewStatusBadge({ status }: { status: TeamActionMapReview['weeklyStatus'] }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1',
        getWeeklyReviewStatusBadgeClassName(status),
      )}
    >
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', getWeeklyReviewStatusDotClassName(status))}
        aria-hidden="true"
      />
      <span className="text-[11px] font-semibold">{getWeeklyReviewStatusLabel(status)}</span>
    </div>
  )
}

export function MemberWeeklyReviewCard({ review }: MemberWeeklyReviewCardProps) {
  if (!review) {
    return (
      <article className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/8">
            <ClipboardCheck className="h-5 w-5 text-hero-text/45" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-hero-text">Última revisión del grupo</h3>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/65">
              Tu grupo aún no tiene una revisión semanal publicada.
            </p>
            <Link
              to="/dashboard/plan"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-light transition-colors hover:text-gold"
            >
              Ver Plan de Acción
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    )
  }

  const progressSummary = truncateReviewText(review.progressSummary)
  const nextAdjustments = truncateReviewText(review.nextAdjustments)

  return (
    <article className="rounded-2xl border border-teal-accent/20 bg-gradient-to-br from-teal-accent/8 via-white/8 to-transparent p-5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
            <ClipboardCheck className="h-5 w-5 text-teal-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-teal-accent/80">
              Mapa de ruta
            </p>
            <h3 className="mt-1 text-base font-semibold text-hero-text">Última revisión del grupo</h3>
          </div>
        </div>
        <WeeklyReviewStatusBadge status={review.weeklyStatus} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-hero-text/70">
        Tu grupo revisó el avance de la semana. Mira el enfoque recomendado para seguir avanzando.
      </p>

      <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">Semana</p>
          <p className="mt-1 text-sm font-medium text-hero-text">{review.weekLabel}</p>
        </div>

        {progressSummary ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">
              Qué avanzó
            </p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/75">{progressSummary}</p>
          </div>
        ) : null}

        {nextAdjustments ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">
              Próximo ajuste
            </p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/75">{nextAdjustments}</p>
          </div>
        ) : null}
      </div>

      <Link
        to="/dashboard/plan"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-light transition-colors hover:text-gold"
      >
        Ver Plan de Acción
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </article>
  )
}
