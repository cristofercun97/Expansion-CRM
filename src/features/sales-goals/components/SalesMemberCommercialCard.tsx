import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import {
  SalesCommercialStatusBadge,
  SalesMemberReportsList,
} from '@/features/sales-goals/components/SalesCommercialShared'
import type {
  SalesMemberCommercialSummary,
  TeamSalesGoal,
  TeamSalesReport,
} from '@/features/sales-goals/types/sales-goal.types'
import { formatSalesCurrency } from '@/features/sales-goals/utils/salesGoalUtils'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

type SalesMemberCommercialCardProps = {
  summary: SalesMemberCommercialSummary
  reports: TeamSalesReport[]
  goal: TeamSalesGoal
}

export function SalesMemberCommercialCard({
  summary,
  reports,
  goal,
}: SalesMemberCommercialCardProps) {
  const [expanded, setExpanded] = useState(false)

  const memberReports = useMemo(
    () =>
      reports
        .filter((report) => report.memberUid.trim() === summary.memberUid)
        .sort((left, right) => {
          const leftTime = left.reportedAt?.toMillis?.() ?? left.createdAt?.toMillis?.() ?? 0
          const rightTime = right.reportedAt?.toMillis?.() ?? right.createdAt?.toMillis?.() ?? 0
          return rightTime - leftTime
        }),
    [reports, summary.memberUid],
  )

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-hero-text">{summary.memberName}</h4>
            <SalesCommercialStatusBadge status={summary.commercialStatus} />
          </div>
          <p className="mt-1 text-lg font-semibold text-gold-light">
            {formatSalesCurrency(summary.totalValidatedAmount, goal.currency)}
          </p>
          <p className="text-xs text-hero-text/60">Total validado</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? (
            <>
              Ocultar reportes
              <ChevronUp className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Ver reportes
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Validadas" value={String(summary.validatedCount)} accent="text-teal-accent" />
        <Metric label="Pendientes" value={String(summary.pendingCount)} accent="text-gold-light" />
        <Metric label="Rechazadas" value={String(summary.rejectedCount)} accent="text-red-200" />
        <Metric
          label="Aporte al objetivo"
          value={`${summary.contributionPercentage}%`}
          accent="text-hero-text"
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-xs text-hero-text/65">
          <span>Contribución validada</span>
          <span>{summary.contributionPercentage}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-accent to-gold-light transition-all duration-500"
            style={{ width: `${summary.contributionPercentage}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-hero-text/55">
        Total reportado: {formatSalesCurrency(summary.totalReportedAmount, goal.currency)}
        {summary.lastReportedAt
          ? ` · Última actividad: ${formatContactDateTime(summary.lastReportedAt)}`
          : ''}
      </p>

      {expanded ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <SalesMemberReportsList
            reports={memberReports}
            emptyMessage="Sin reportes para este miembro."
          />
        </div>
      ) : null}
    </article>
  )
}

function Metric({
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
