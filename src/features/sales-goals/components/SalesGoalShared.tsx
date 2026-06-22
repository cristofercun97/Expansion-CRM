import { Loader2, Target, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui'
import type { TeamSalesGoal } from '@/features/sales-goals/types/sales-goal.types'
import {
  formatSalesCurrency,
  SALES_GOAL_COPY,
  type SalesGoalProgress,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type SalesGoalProgressBarProps = {
  progress: SalesGoalProgress
  currency: TeamSalesGoal['currency']
  compact?: boolean
}

export function SalesGoalProgressBar({ progress, currency, compact = false }: SalesGoalProgressBarProps) {
  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3')}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-hero-text/70">
          Vendido/validado:{' '}
          <span className="font-semibold text-teal-accent">
            {formatSalesCurrency(progress.validatedAmount, currency)}
          </span>
        </span>
        <span className="font-semibold text-gold-light">{progress.percentage}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-accent to-teal-accent/70 transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      <p className="text-sm text-hero-text/75">
        {progress.status === 'achieved'
          ? SALES_GOAL_COPY.achieved
          : SALES_GOAL_COPY.remaining(formatSalesCurrency(progress.remainingAmount, currency))}
      </p>
    </div>
  )
}

type SalesGoalStatusBadgeProps = {
  label: string
  status: SalesGoalProgress['status']
}

export function SalesGoalStatusBadge({ label, status }: SalesGoalStatusBadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium',
        status === 'achieved' && 'border-gold/30 bg-gold/10 text-gold-light',
        status === 'near_goal' && 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
        status === 'in_progress' && 'border-white/15 bg-white/5 text-hero-text/75',
      )}
    >
      {label}
    </span>
  )
}

type SalesGoalEmptyStateProps = {
  isLeader: boolean
  onConfigure?: () => void
  onGoToPlan?: () => void
  compact?: boolean
}

export function SalesGoalEmptyState({
  isLeader,
  onConfigure,
  onGoToPlan,
  compact = false,
}: SalesGoalEmptyStateProps) {
  return (
    <div className={cn('rounded-xl border border-dashed border-white/15 bg-white/5', compact ? 'p-4' : 'p-5')}>
      <p className="text-sm leading-relaxed text-hero-text/70">
        {isLeader ? SALES_GOAL_COPY.leaderEmpty : SALES_GOAL_COPY.memberEmpty}
      </p>
      {isLeader && onConfigure ? (
        <Button
          type="button"
          className="mt-4 bg-gold text-petrol-deep hover:bg-gold-light"
          onClick={onConfigure}
        >
          {SALES_GOAL_COPY.configureButton}
        </Button>
      ) : null}
      {!isLeader && onGoToPlan ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-white/20 bg-transparent text-hero-text hover:bg-white/10"
          onClick={onGoToPlan}
        >
          {SALES_GOAL_COPY.goToPlan}
        </Button>
      ) : null}
    </div>
  )
}

type SalesGoalLoadingStateProps = {
  compact?: boolean
}

export function SalesGoalLoadingState({ compact = false }: SalesGoalLoadingStateProps) {
  return (
    <p className={cn('flex items-center gap-2 text-sm text-hero-text/70', compact ? 'py-2' : 'py-4')}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Cargando objetivo de ventas...
    </p>
  )
}

type SalesGoalHeaderProps = {
  title?: string
  description?: string
}

export function SalesGoalHeader({ title, description }: SalesGoalHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
        <Target className="h-5 w-5 text-gold-light" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-hero-text">{title ?? SALES_GOAL_COPY.title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">{description}</p>
        ) : null}
      </div>
    </div>
  )
}

export function SalesGoalMetricRow({
  goal,
  progress,
}: {
  goal: TeamSalesGoal
  progress: SalesGoalProgress
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard
        label="Periodo"
        value={goal.periodLabel}
        icon={TrendingUp}
      />
      <MetricCard
        label="Objetivo"
        value={formatSalesCurrency(progress.targetAmount, goal.currency)}
        accent="text-gold-light"
      />
      <MetricCard
        label="Estado"
        value={progress.statusLabel}
        accent={
          progress.status === 'achieved'
            ? 'text-gold-light'
            : progress.status === 'near_goal'
              ? 'text-teal-accent'
              : 'text-hero-text'
        }
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = 'text-hero-text',
}: {
  label: string
  value: string
  icon?: typeof TrendingUp
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">{label}</p>
      <p className={cn('mt-1 flex items-center gap-2 text-sm font-semibold', accent)}>
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" /> : null}
        {value}
      </p>
    </div>
  )
}
