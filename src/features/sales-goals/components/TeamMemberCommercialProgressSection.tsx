import type {
  SalesMemberCommercialSummary,
  TeamSalesGoal,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import {
  SalesCommercialStatusBadge,
  SalesMemberReportsList,
} from '@/features/sales-goals/components/SalesCommercialShared'
import { formatSalesCurrency, SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

type TeamMemberCommercialProgressSectionProps = {
  summary: SalesMemberCommercialSummary | null
  goal: TeamSalesGoal | null
  reports: TeamSalesReport[]
  className?: string
}

function formatLastSaleLabel(summary: SalesMemberCommercialSummary | null): string {
  if (!summary?.lastSaleAt) {
    return 'Sin ventas registradas'
  }

  return formatContactDateTime(summary.lastSaleAt)
}

export function TeamMemberCommercialProgressSection({
  summary,
  goal,
  reports,
  className,
}: TeamMemberCommercialProgressSectionProps) {
  const currency = goal?.currency ?? 'EUR'
  const memberReports = summary
    ? reports
        .filter((report) => report.memberUid.trim() === summary.memberUid)
        .sort((left, right) => {
          const leftTime = left.reportedAt?.toMillis?.() ?? left.createdAt?.toMillis?.() ?? 0
          const rightTime = right.reportedAt?.toMillis?.() ?? right.createdAt?.toMillis?.() ?? 0
          return rightTime - leftTime
        })
        .slice(0, 5)
    : []

  const hasCommercialActivity = summary && summary.reportedCount > 0

  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-hero-text">
          {SALES_GOAL_COPY.memberCommercialProgressTitle}
        </h3>
        <p className="mt-1 text-sm text-hero-text/70">
          {SALES_GOAL_COPY.memberCommercialProgressDescription}
        </p>
      </div>

      {!hasCommercialActivity ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm leading-relaxed text-hero-text/75">
          {SALES_GOAL_COPY.memberCommercialProgressEmpty}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SalesCommercialStatusBadge status={summary.commercialStatus} />
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric
              label="Vendido este mes"
              value={formatSalesCurrency(summary.totalValidatedCurrentMonth, currency)}
            />
            <Metric
              label="Vendido total"
              value={formatSalesCurrency(summary.totalValidatedAllTime, currency)}
            />
            <Metric label="Ventas validadas" value={String(summary.validatedCount)} />
            <Metric label="Pendientes de validar" value={String(summary.pendingCount)} />
            <Metric label="Última venta" value={formatLastSaleLabel(summary)} />
            <Metric
              label="Aporte al objetivo"
              value={goal ? `${summary.contributionPercentage}%` : '—'}
            />
          </dl>

          {summary.validatedCount === 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-hero-text/70">
              {SALES_GOAL_COPY.memberCommercialProgressEmpty}
            </p>
          ) : null}

          {summary.pendingCount > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-gold-light/90">
              {SALES_GOAL_COPY.memberCommercialPendingNotice}
            </p>
          ) : null}
        </div>
      )}

      {memberReports.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-hero-text">Últimas ventas</h4>
          <SalesMemberReportsList reports={memberReports} className="mt-2" />
        </div>
      ) : null}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-hero-text/55">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-hero-text">{value}</dd>
    </div>
  )
}
