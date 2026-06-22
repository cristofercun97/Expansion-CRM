import { CalendarRange, ChevronRight, Flag, Sparkles, Target } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import type { ActionTask } from '@/features/action-plan/types/action-plan.types'
import type { TeamActionMapReview } from '@/features/action-plan/types/team-action-map-review.types'
import type { TeamActionMap, TeamMapArea, TeamMapStatus } from '@/features/action-plan/types/team-action-map.types'
import { getWeeklyReviewStatusLabel } from '@/features/action-plan/utils/teamActionMapReviewUtils'
import { countTasksLinkedToArea } from '@/features/action-plan/utils/actionTaskRoadmapUtils'
import {
  calculateTeamMapGeneralProgress,
  formatTeamMapDateLabel,
  formatTeamMapDateRange,
  getTeamMapStatusAccentClassName,
  getTeamMapStatusBadgeClassName,
  getTeamMapStatusBarClassName,
  getTeamMapStatusDotClassName,
  getTeamMapStatusLabel,
  getTeamMapStatusProgressValue,
  getTeamMapStatusShortLabel,
} from '@/features/action-plan/utils/teamActionMapUtils'
import { cn } from '@/lib/utils'

type TeamActionMapVisualSummaryProps = {
  map: TeamActionMap
  linkedTasks: ActionTask[]
  lastReview?: TeamActionMapReview | null
  onViewReview?: () => void
}

function StatusTrafficBadge({ status }: { status: TeamMapStatus }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        getTeamMapStatusBadgeClassName(status),
      )}
    >
      <span
        className={cn('h-2.5 w-2.5 shrink-0 rounded-full', getTeamMapStatusDotClassName(status))}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold">{getTeamMapStatusLabel(status)}</span>
    </div>
  )
}

function ProgressBar({
  value,
  status,
  label,
  compact = false,
}: {
  value: number
  status: TeamMapStatus
  label?: string
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {label ? (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-hero-text/60">{label}</span>
          <span className="font-semibold text-hero-text">{value}%</span>
        </div>
      ) : null}
      <div
        className={cn(
          'overflow-hidden rounded-full bg-white/10',
          compact ? 'h-1.5' : 'h-2.5',
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            getTeamMapStatusBarClassName(status),
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function MapPeriodTimeline({ map }: { map: TeamActionMap }) {
  const startLabel = formatTeamMapDateLabel(map.startDate) ?? 'Sin inicio'
  const endLabel = formatTeamMapDateLabel(map.endDate) ?? 'Sin cierre'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-hero-text/50">
        Línea del periodo
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Inicio</p>
          <p className="mt-1 text-xs font-medium text-hero-text/85 sm:text-sm">{startLabel}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-white/25" aria-hidden="true" />

        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Periodo</p>
          <p className="mt-1 text-xs font-medium text-gold-light sm:text-sm">{map.periodLabel}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-white/25 via-white/25 to-transparent" aria-hidden="true" />

        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Fin</p>
          <p className="mt-1 text-xs font-medium text-hero-text/85 sm:text-sm">{endLabel}</p>
        </div>
      </div>

      <div className="relative mt-4 hidden h-1 overflow-hidden rounded-full bg-white/10 sm:block">
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-teal-accent/40 via-gold/50 to-teal-accent/20" />
        <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-teal-accent" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-gold/80" />
        <div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/50" />
      </div>
    </div>
  )
}

function MapAreaVisualCard({
  area,
  linkedCount,
}: {
  area: TeamMapArea
  linkedCount: number
}) {
  const areaStatus = area.status ?? 'yellow'
  const progressValue = getTeamMapStatusProgressValue(areaStatus)

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white/5 p-4 backdrop-blur-sm transition-colors',
        getTeamMapStatusAccentClassName(areaStatus),
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          getTeamMapStatusBarClassName(areaStatus),
        )}
        aria-hidden="true"
      />

      <div className="pl-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h5 className="text-sm font-semibold text-hero-text">{area.title}</h5>
          <Badge className={cn('border', getTeamMapStatusBadgeClassName(areaStatus))}>
            {getTeamMapStatusShortLabel(areaStatus)}
          </Badge>
        </div>

        {area.objective ? (
          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Objetivo</p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/80">{area.objective}</p>
          </div>
        ) : null}

        {area.indicator ? (
          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Indicador</p>
            <p className="mt-1 text-sm leading-relaxed text-hero-text/70">{area.indicator}</p>
          </div>
        ) : null}

        {area.description && !area.objective ? (
          <p className="mt-3 text-sm leading-relaxed text-hero-text/70">{area.description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-hero-text/55">
          <span>
            {linkedCount === 0
              ? 'Sin acciones vinculadas'
              : linkedCount === 1
                ? '1 acción vinculada'
                : `${linkedCount} acciones vinculadas`}
          </span>
        </div>

        <div className="mt-3">
          <ProgressBar value={progressValue} status={areaStatus} compact />
        </div>
      </div>
    </article>
  )
}

function LatestReviewMiniBlock({
  review,
  onViewReview,
}: {
  review: TeamActionMapReview
  onViewReview?: () => void
}) {
  return (
    <div className="rounded-2xl border border-teal-accent/20 bg-teal-accent/5 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-teal-accent/80">
            Revisión semanal
          </p>
          <p className="text-sm font-medium text-hero-text">
            Última revisión: {review.weekLabel}
          </p>
          <p className="text-xs text-hero-text/65">
            Estado semanal: {getWeeklyReviewStatusLabel(review.weeklyStatus)}
          </p>
        </div>

        {onViewReview ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewReview}
            className="border-teal-accent/25 bg-white/5 text-teal-accent hover:bg-teal-accent/10"
          >
            Ver revisión
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function TeamActionMapVisualSummary({
  map,
  linkedTasks,
  lastReview = null,
  onViewReview,
}: TeamActionMapVisualSummaryProps) {
  const dateRangeLabel = formatTeamMapDateRange(map.startDate, map.endDate)
  const generalProgress = calculateTeamMapGeneralProgress(map.areas, map.status)

  return (
    <div className="space-y-5">
      <article className="overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-gold-light/80">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-[0.16em]">Mapa activo</p>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-hero-text">{map.title}</h3>
            </div>
            <StatusTrafficBadge status={map.status} />
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {map.vision ? (
            <div className="rounded-xl border border-gold/15 bg-gold/5 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gold-light/70">
                Visión del grupo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gold-light/95">{map.vision}</p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Target className="h-4 w-4 text-teal-accent" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-hero-text/45">
                    Objetivo principal
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-hero-text/85">
                    {map.mainObjective}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <CalendarRange className="h-4 w-4 text-gold-light" aria-hidden="true" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Periodo</p>
                    <p className="mt-1 font-medium text-hero-text/85">{map.periodLabel}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-hero-text/45">Fechas</p>
                    <p className="mt-1 text-hero-text/80">
                      {dateRangeLabel ?? 'Sin fechas definidas'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4 text-teal-accent" aria-hidden="true" />
              <p className="text-sm font-medium text-hero-text">Avance general del mapa</p>
            </div>
            <ProgressBar
              value={generalProgress}
              status={map.status}
              label={`Avance general: ${generalProgress}%`}
            />
            {map.areas.length > 0 ? (
              <p className="mt-2 text-xs text-hero-text/50">
                Calculado según el estado de {map.areas.length}{' '}
                {map.areas.length === 1 ? 'área' : 'áreas'} de enfoque.
              </p>
            ) : null}
          </div>

          {map.description ? (
            <p className="text-sm leading-relaxed text-hero-text/65">{map.description}</p>
          ) : null}
        </div>
      </article>

      <MapPeriodTimeline map={map} />

      {lastReview ? (
        <LatestReviewMiniBlock review={lastReview} onViewReview={onViewReview} />
      ) : null}

      {map.areas.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-hero-text">Áreas de enfoque</h4>
            <span className="text-xs text-hero-text/50">
              {map.areas.length} {map.areas.length === 1 ? 'área' : 'áreas'}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {map.areas.map((area) => (
              <MapAreaVisualCard
                key={area.id}
                area={area}
                linkedCount={countTasksLinkedToArea(linkedTasks, area.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-hero-text/65">
          El mapa aún no tiene áreas definidas.
        </p>
      )}
    </div>
  )
}
