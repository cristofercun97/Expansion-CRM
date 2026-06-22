import { Crown, Medal, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { PodiumIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type {
  DashboardRankingEntry,
  DashboardRankingOverview,
} from '@/features/dashboard/types/dashboard-overview.types'
import {
  formatPodiumDisplayName,
  formatPodiumMeritLabel,
} from '@/features/dashboard/utils/dashboardPodiumDisplay.utils'
import { cn } from '@/lib/utils'

type DashboardPointsPodiumCardProps = {
  ranking: DashboardRankingOverview
  loading?: boolean
}

const PODIUM_ICONS = [Crown, Medal, Trophy]
const PODIUM_MERIT = [
  'Lidera con constancia y compromiso',
  'Segundo con gran aporte al equipo',
  'Tercero con avance sostenido',
]
const PODIUM_HEIGHTS = ['h-24', 'h-16', 'h-12']
const PODIUM_LABELS = ['1º', '2º', '3º']

const PODIUM_VISUAL_ORDER = [
  { placeIndex: 1, layoutOrder: 'order-1' },
  { placeIndex: 0, layoutOrder: 'order-2' },
  { placeIndex: 2, layoutOrder: 'order-3' },
] as const

function getPodiumEntries(ranking: DashboardRankingOverview): DashboardRankingEntry[] {
  return ranking.weeklyTop3
}

function getPodiumSubtitle(ranking: DashboardRankingOverview) {
  if (ranking.rankingSource === 'published_weekly') {
    return 'Top 3 semanal publicado por puntos totales.'
  }

  if (ranking.rankingSource === 'live_weekly') {
    return 'Top 3 semanal en vivo por puntos totales.'
  }

  if (ranking.rankingSource === 'monthly_aggregate') {
    return 'Acumulado mensual por puntos totales.'
  }

  return 'Puntos totales: ventas validadas, tareas, formación, actividad y constancia.'
}

function getPodiumMeritLabel(entry: DashboardRankingEntry, rank: number, index: number): string {
  if (entry.activitySummary?.trim()) {
    return entry.activitySummary.trim()
  }

  return formatPodiumMeritLabel(entry.memberName, rank, PODIUM_MERIT[index])
}

function getPeriodLabel(ranking: DashboardRankingOverview): string | null {
  if (ranking.rankingSource === 'published_weekly' && ranking.weekLabel) {
    return `Semana publicada: ${ranking.weekLabel}`
  }

  if (ranking.rankingSource === 'live_weekly' && ranking.weekLabel) {
    return `Semana en curso: ${ranking.weekLabel}`
  }

  if (ranking.rankingSource === 'monthly_aggregate') {
    return 'Fuente: acumulado mensual publicado'
  }

  return null
}

export function DashboardPointsPodiumCard({ ranking, loading = false }: DashboardPointsPodiumCardProps) {
  const entries = getPodiumEntries(ranking)
  const hasRanking = entries.length > 0

  return (
    <DashboardOverviewCard
      title="Podio del grupo"
      subtitle={getPodiumSubtitle(ranking)}
      loading={loading}
      illustration={hasRanking ? <PodiumIllustration size="header" /> : undefined}
      compact={!loading && !hasRanking}
      className={!hasRanking && !loading ? 'self-start' : undefined}
    >
      {!loading && !hasRanking ? (
        <DashboardEmptyState
          minimal
          title="El podio está esperando protagonistas"
          description="Publica el ranking semanal y convierte los avances del equipo en reconocimiento visible."
          action={
            <Link to="/dashboard/reconocimientos">
              <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
                Ir a Reconocimientos
              </Button>
            </Link>
          }
        />
      ) : null}

      {!loading && hasRanking ? (
        <div className="space-y-4">
          <div className="flex items-end justify-center gap-2 px-1 sm:gap-3" aria-hidden="true">
            {PODIUM_VISUAL_ORDER.map(({ placeIndex, layoutOrder }) => {
              const entry = entries[placeIndex]
              const rank = placeIndex + 1
              const Icon = PODIUM_ICONS[placeIndex] ?? Medal
              const isLeader = placeIndex === 0

              return (
                <div
                  key={`podium-slot-${rank}`}
                  className={cn(
                    'flex max-w-[6.5rem] flex-1 flex-col items-center sm:max-w-[7rem]',
                    layoutOrder,
                  )}
                >
                  {entry ? (
                    <>
                      <Icon
                        className={cn(
                          'mb-1',
                          isLeader ? 'h-7 w-7 text-gold-light' : 'h-5 w-5 text-teal-accent',
                        )}
                      />
                      <p
                        className={cn(
                          'max-w-full truncate text-center font-medium text-hero-text',
                          isLeader ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs',
                        )}
                      >
                        {formatPodiumDisplayName(entry.memberName, rank)}
                      </p>
                      <p
                        className={cn(
                          'font-bold text-gold-light',
                          isLeader ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl',
                        )}
                      >
                        {entry.points}
                      </p>
                      <p className="text-[10px] text-hero-text/50">puntos</p>
                    </>
                  ) : (
                    <>
                      <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-hero-text/45">
                        {PODIUM_LABELS[placeIndex]}
                      </span>
                      <p className="text-center text-[11px] text-hero-text/45">Por conquistar</p>
                      <p className="mt-3 text-lg font-medium text-hero-text/30">—</p>
                    </>
                  )}
                  <div
                    className={cn(
                      'mt-2 w-full rounded-t-lg border',
                      entry ? PODIUM_HEIGHTS[placeIndex] : 'h-10',
                      entry
                        ? isLeader
                          ? 'border-gold/35 bg-gradient-to-t from-gold/30 to-gold/8'
                          : 'border-teal-accent/25 bg-gradient-to-t from-teal-accent/15 to-white/5'
                        : 'border-dashed border-white/15 bg-white/4',
                    )}
                  />
                </div>
              )
            })}
          </div>

          <ul className="space-y-2">
            {entries.map((entry, index) => {
              const Icon = PODIUM_ICONS[index] ?? Medal
              const isLeader = index === 0
              const rank = index + 1
              const displayName = formatPodiumDisplayName(entry.memberName, rank)

              return (
                <li
                  key={`${entry.memberUid}-${entry.rank}`}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4',
                    isLeader
                      ? 'border-gold/40 bg-gradient-to-r from-gold/18 to-gold/5 shadow-[0_4px_16px_rgba(217,164,65,0.08)]'
                      : 'border-white/10 bg-white/5',
                  )}
                >
                  <div
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-xl',
                      isLeader ? 'h-11 w-11 bg-gold/25 text-gold-light' : 'h-9 w-9 bg-teal-accent/15 text-teal-accent',
                    )}
                  >
                    <Icon className={cn(isLeader ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-medium text-hero-text', isLeader && 'text-base')}>
                      {displayName}
                    </p>
                    <p className="text-xs text-hero-text/60">
                      {getPodiumMeritLabel(entry, rank, index)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold text-gold-light',
                        isLeader ? 'text-xl sm:text-2xl' : 'text-base',
                      )}
                    >
                      {entry.points}
                    </p>
                    <p className="text-[10px] text-hero-text/55">puntos</p>
                  </div>
                </li>
              )
            })}
          </ul>

          {entries.length < 3 ? (
            <p className="text-center text-xs text-hero-text/50">
              El 2º y 3º puesto se abren cuando más miembros sumen puntos esta semana.
            </p>
          ) : null}

          {ranking.pointsBreakdown ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-hero-text/65">
              Tu desglose: academia {ranking.pointsBreakdown.academyPoints} · tareas{' '}
              {ranking.pointsBreakdown.taskPoints} · recordatorios{' '}
              {ranking.pointsBreakdown.reminderPoints} · ventas {ranking.pointsBreakdown.salesPoints} ·
              bonus {ranking.pointsBreakdown.bonusPoints}
            </p>
          ) : null}

          {(() => {
            const periodLabel = getPeriodLabel(ranking)
            return periodLabel ? (
              <p className="text-xs text-hero-text/55">{periodLabel}</p>
            ) : null
          })()}

          <Link to="/dashboard/reconocimientos">
            <Button size="sm" variant="secondary" className="border-white/15 bg-white/8 text-hero-text">
              Ver reconocimientos
            </Button>
          </Link>
        </div>
      ) : null}
    </DashboardOverviewCard>
  )
}
