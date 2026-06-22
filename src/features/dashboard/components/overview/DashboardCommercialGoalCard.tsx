import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { DashboardEmptyState } from '@/features/dashboard/components/overview/DashboardEmptyState'
import { DashboardOverviewCard } from '@/features/dashboard/components/overview/DashboardOverviewCard'
import { GoalMountainIllustration } from '@/features/dashboard/components/overview/illustrations/DashboardIllustrations'
import type {
  DashboardCommercialGoalOverview,
  DashboardSalesOverview,
} from '@/features/dashboard/types/dashboard-overview.types'
import {
  formatDashboardCurrency,
  getCommercialGoalStatusClass,
  getCommercialGoalStatusLabel,
} from '@/features/dashboard/utils/dashboardOverviewFormatters'
import { getCommercialGoalHumanMessage } from '@/features/dashboard/utils/dashboardOverviewMicrocopy'
import { cn } from '@/lib/utils'

type DashboardCommercialGoalCardProps = {
  commercialGoal: DashboardCommercialGoalOverview
  sales: DashboardSalesOverview
  loading?: boolean
}

export function DashboardCommercialGoalCard({
  commercialGoal,
  sales,
  loading = false,
}: DashboardCommercialGoalCardProps) {
  const hasGoal = commercialGoal.status !== 'no_goal' && commercialGoal.goalAmount !== null
  const progressPercent = commercialGoal.progressPercent ?? 0

  return (
    <DashboardOverviewCard
      title="Objetivo del mes"
      subtitle={
        commercialGoal.periodLabel
          ? `Periodo: ${commercialGoal.periodLabel}`
          : 'La meta que orienta al equipo'
      }
      loading={loading}
      illustration={<GoalMountainIllustration size="header" />}
      headerAction={
        hasGoal ? (
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3',
              getCommercialGoalStatusClass(commercialGoal.status),
            )}
          >
            {getCommercialGoalStatusLabel(commercialGoal.status)}
          </span>
        ) : null
      }
    >
      {!loading && !hasGoal ? (
        <DashboardEmptyState
          compact
          title="Sin objetivo configurado"
          description="Define una meta para que el equipo tenga dirección."
          illustration={<GoalMountainIllustration size="sm" className="mx-auto opacity-75" />}
          action={
            <Link to="/dashboard/plan">
              <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
                Ir a Plan de Acción
              </Button>
            </Link>
          }
        />
      ) : null}

      {!loading && hasGoal ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/10 to-teal-accent/5 px-4 py-3 text-sm leading-relaxed text-hero-text/85">
            {getCommercialGoalHumanMessage(commercialGoal.status)}
          </p>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-hero-text/55">Meta del mes</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gold-light sm:text-3xl">
                {formatDashboardCurrency(commercialGoal.validatedAmount)}{' '}
                <span className="text-base font-normal text-hero-text/60 sm:text-lg">
                  / {formatDashboardCurrency(commercialGoal.goalAmount ?? 0)}
                </span>
              </p>
              <p className="mt-2 text-sm text-hero-text/75">
                {commercialGoal.status === 'completed'
                  ? 'Meta cumplida'
                  : `Faltan ${formatDashboardCurrency(commercialGoal.remainingAmount ?? 0)}`}
              </p>
              {commercialGoal.status !== 'completed' &&
              commercialGoal.remainingAmount !== null &&
              commercialGoal.remainingAmount > 0 ? (
                <p className="mt-1 text-xs italic text-hero-text/60">
                  Ese es el tramo que el equipo debe conquistar.
                </p>
              ) : null}
              {commercialGoal.daysRemaining !== null ? (
                <p className="mt-1 text-xs text-teal-accent">
                  Días restantes: {commercialGoal.daysRemaining}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-2 lg:min-w-[7.5rem]">
              <div
                className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/25 bg-gradient-to-br from-gold/15 to-teal-accent/10 sm:h-28 sm:w-28"
                aria-hidden="true"
              >
                <span className="text-2xl font-bold text-gold-light sm:text-3xl">{progressPercent}%</span>
              </div>
              <GoalMountainIllustration size="sm" className="opacity-80" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-hero-text/60">
              <span>Avance validado</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-accent to-gold transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <MetricChip
              label="Vendido validado"
              value={formatDashboardCurrency(commercialGoal.validatedAmount)}
              accent="teal"
            />
            <MetricChip
              label="Pendiente de validar"
              value={`${sales.pendingSalesCount} (${formatDashboardCurrency(sales.pendingSalesAmount)})`}
            />
            <MetricChip
              label="Faltante"
              value={formatDashboardCurrency(commercialGoal.remainingAmount ?? 0)}
              accent="gold"
            />
            <MetricChip
              label="Estado"
              value={getCommercialGoalStatusLabel(commercialGoal.status)}
            />
          </dl>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {sales.pendingSalesCount > 0 ? (
              <Link to="/dashboard/progreso-equipo">
                <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
                  Revisar ventas pendientes
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard/plan">
                <Button size="sm" className="bg-gold text-petrol-deep hover:bg-gold-light">
                  Ver Plan de Acción
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </DashboardOverviewCard>
  )
}

function MetricChip({
  label,
  value,
  accent = 'neutral',
}: {
  label: string
  value: string
  accent?: 'teal' | 'gold' | 'neutral'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5 sm:px-3 sm:py-3',
        accent === 'teal' && 'border-teal-accent/20 bg-teal-accent/8',
        accent === 'gold' && 'border-gold/20 bg-gold/8',
        accent === 'neutral' && 'border-white/10 bg-white/5',
      )}
    >
      <dt className="text-[10px] uppercase tracking-wide text-hero-text/55 sm:text-[11px]">{label}</dt>
      <dd className="mt-1 text-xs font-semibold text-hero-text sm:text-sm">{value}</dd>
    </div>
  )
}
