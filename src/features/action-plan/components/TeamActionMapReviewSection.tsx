import { CalendarRange, ClipboardCheck, Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/toast/ToastProvider'
import { TeamActionMapReviewModal } from '@/features/action-plan/components/TeamActionMapReviewModal'
import { teamActionMapReviewService } from '@/features/action-plan/services/team-action-map-review.service'
import type {
  CreateTeamActionMapReviewInput,
  TeamActionMapReview,
} from '@/features/action-plan/types/team-action-map-review.types'
import {
  getWeeklyReviewStatusBadgeClassName,
  getWeeklyReviewStatusDotClassName,
  getWeeklyReviewStatusLabel,
} from '@/features/action-plan/utils/teamActionMapReviewUtils'
import { cn } from '@/lib/utils'

type TeamActionMapReviewSectionProps = {
  teamId: string
  ownerUid: string
  canEdit: boolean
  reviews: TeamActionMapReview[]
  loading: boolean
  error: string
  reload: () => void
  className?: string
}

const HISTORY_LIMIT = 5

function WeeklyReviewStatusBadge({ status }: { status: TeamActionMapReview['weeklyStatus'] }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        getWeeklyReviewStatusBadgeClassName(status),
      )}
    >
      <span
        className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getWeeklyReviewStatusDotClassName(status))}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold">{getWeeklyReviewStatusLabel(status)}</span>
    </div>
  )
}

function ReviewField({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/45">{label}</p>
      <p className={cn('leading-relaxed text-hero-text/80', compact ? 'text-xs' : 'text-sm')}>
        {trimmed}
      </p>
    </div>
  )
}

function FeaturedReviewCard({
  review,
  canEdit,
  compact = false,
}: {
  review: TeamActionMapReview
  canEdit: boolean
  compact?: boolean
}) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-white/15 bg-white/8 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-5',
        compact && 'bg-white/5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-light/75">
            {canEdit ? 'Última revisión' : 'Última revisión del grupo'}
          </p>
          <h4 className="mt-1 text-lg font-semibold text-hero-text">{review.weekLabel}</h4>
        </div>
        <WeeklyReviewStatusBadge status={review.weeklyStatus} />
      </div>

      <div className="mt-4 space-y-4">
        <ReviewField label="Qué avanzó" value={review.progressSummary} compact={compact} />

        {canEdit ? (
          <ReviewField label="Qué está bloqueado" value={review.blockers} compact={compact} />
        ) : null}

        <ReviewField
          label={canEdit ? 'Qué ajustaremos' : 'Próximo ajuste'}
          value={review.nextAdjustments}
          compact={compact}
        />
      </div>
    </article>
  )
}

function HistoryReviewItem({ review }: { review: TeamActionMapReview }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-hero-text">{review.weekLabel}</p>
        <WeeklyReviewStatusBadge status={review.weeklyStatus} />
      </div>
      {review.progressSummary.trim() ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-hero-text/65">
          {review.progressSummary.trim()}
        </p>
      ) : null}
    </article>
  )
}

export function TeamActionMapReviewSection({
  teamId,
  ownerUid,
  canEdit,
  reviews,
  loading,
  error,
  reload,
  className,
}: TeamActionMapReviewSectionProps) {
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const latestReview = reviews[0] ?? null
  const historyReviews = reviews.slice(1, HISTORY_LIMIT)

  if (!canEdit && !loading && reviews.length === 0) {
    return null
  }

  async function handleCreateReview(input: CreateTeamActionMapReviewInput) {
    setIsSubmitting(true)

    try {
      await teamActionMapReviewService.createTeamActionMapReview(input)
      showToast('Revisión semanal guardada.', 'success')
      reload()
    } catch {
      throw new Error('No pudimos guardar la revisión semanal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section
        id="team-action-map-review"
        className={cn(
          'mt-5 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl sm:p-5',
          className,
        )}
        aria-label="Revisión semanal"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
              <ClipboardCheck className="h-5 w-5 text-teal-accent" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-hero-text">Revisión semanal</h3>
              <p className="mt-1 text-sm text-hero-text/70">
                {canEdit
                  ? 'Haz una pausa rápida, revisa qué avanzó y define el próximo movimiento del equipo.'
                  : 'Así va el rumbo del grupo esta semana.'}
              </p>
            </div>
          </div>

          {canEdit ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-gold text-petrol-deep hover:bg-gold-light"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Crear revisión semanal
            </Button>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-hero-text/70">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando revisiones semanales...
          </p>
        ) : error ? (
          <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : !latestReview ? (
          canEdit ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-5 text-center sm:px-6">
              <CalendarRange className="mx-auto h-8 w-8 text-gold-light/70" aria-hidden="true" />
              <p className="mt-3 text-sm leading-relaxed text-hero-text/75">
                Todavía no hay revisiones semanales. Cuando revisas el avance, tu equipo gana
                dirección.
              </p>
              <Button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 bg-gold text-petrol-deep hover:bg-gold-light"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Crear revisión semanal
              </Button>
            </div>
          ) : null
        ) : (
          <div className="mt-5 space-y-4">
            <FeaturedReviewCard review={latestReview} canEdit={canEdit} compact={!canEdit} />

            {canEdit && historyReviews.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-hero-text">Historial reciente</h4>
                  <span className="text-xs text-hero-text/50">
                    Últimas {Math.min(reviews.length, HISTORY_LIMIT)} revisiones
                  </span>
                </div>
                <div className="space-y-2">
                  {historyReviews.map((review) => (
                    <HistoryReviewItem key={review.id} review={review} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {canEdit ? (
        <TeamActionMapReviewModal
          open={isModalOpen}
          isSubmitting={isSubmitting}
          teamId={teamId}
          ownerUid={ownerUid}
          onClose={() => {
            if (!isSubmitting) {
              setIsModalOpen(false)
            }
          }}
          onSubmit={handleCreateReview}
        />
      ) : null}
    </>
  )
}
