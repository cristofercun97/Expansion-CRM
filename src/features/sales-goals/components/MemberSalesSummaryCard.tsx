import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui'
import type {
  SalesMemberCommercialSummary,
  TeamSalesGoal,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  SALES_COMMERCIAL_STATUS_LABELS,
} from '@/features/sales-goals/utils/salesReportAnalytics'
import { formatSalesCurrency, SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type MemberSalesSummaryCardProps = {
  summary: SalesMemberCommercialSummary
  goal: TeamSalesGoal
  onReportSale?: () => void
  disableReport?: boolean
  className?: string
}

export function MemberSalesSummaryCard({
  summary,
  goal,
  onReportSale,
  disableReport = false,
  className,
}: MemberSalesSummaryCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-teal-accent/20 bg-teal-accent/5 p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-accent/25 bg-teal-accent/10">
          <TrendingUp className="h-5 w-5 text-teal-accent" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-hero-text">
              {SALES_GOAL_COPY.memberCommercialTitle}
            </h3>
            <span className="rounded-full border border-teal-accent/25 bg-teal-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-teal-accent">
              {SALES_COMMERCIAL_STATUS_LABELS[summary.commercialStatus]}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-hero-text/70">
            {SALES_GOAL_COPY.memberCommercialMotivation}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric
          label="Total validado"
          value={formatSalesCurrency(summary.totalValidatedAmount, goal.currency)}
          accent="text-gold-light"
        />
        <SummaryMetric label="Pendientes" value={String(summary.pendingCount)} />
        <SummaryMetric label="Validadas" value={String(summary.validatedCount)} />
        <SummaryMetric label="Rechazadas" value={String(summary.rejectedCount)} />
      </div>

      <p className="mt-4 text-sm text-hero-text/75">
        Aporte al objetivo del grupo:{' '}
        <span className="font-semibold text-teal-accent">{summary.contributionPercentage}%</span>
      </p>

      {onReportSale ? (
        <Button
          type="button"
          className="mt-4 bg-gold text-petrol-deep hover:bg-gold-light"
          disabled={disableReport}
          title={disableReport ? SALES_GOAL_COPY.noActiveGoalReport : undefined}
          onClick={onReportSale}
        >
          {SALES_GOAL_COPY.reportSaleButton}
        </Button>
      ) : null}
    </section>
  )
}

function SummaryMetric({
  label,
  value,
  accent = 'text-hero-text',
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-hero-text/50">{label}</p>
      <p className={cn('mt-1 text-sm font-semibold', accent)}>{value}</p>
    </div>
  )
}
