import type { SalesMemberCommercialStatus } from '@/features/sales-goals/types/sales-goal.types'
import type { TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import { SALES_COMMERCIAL_STATUS_LABELS } from '@/features/sales-goals/utils/salesReportAnalytics'
import { formatSalesCurrency } from '@/features/sales-goals/utils/salesGoalUtils'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

const REPORT_STATUS_LABELS = {
  reported: 'Pendiente',
  validated: 'Validada',
  rejected: 'Rechazada',
} as const

type SalesMemberReportsListProps = {
  reports: TeamSalesReport[]
  emptyMessage?: string
  className?: string
}

export function SalesMemberReportsList({
  reports,
  emptyMessage = 'Sin ventas registradas.',
  className,
}: SalesMemberReportsListProps) {
  if (reports.length === 0) {
    return <p className={cn('text-sm text-hero-text/65', className)}>{emptyMessage}</p>
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {reports.map((report) => (
        <li
          key={report.id}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-gold-light">
              {formatSalesCurrency(report.amount, report.currency)}
            </span>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                report.status === 'reported' && 'border-gold/25 bg-gold/10 text-gold-light',
                report.status === 'validated' &&
                  'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
                report.status === 'rejected' && 'border-red-400/25 bg-red-500/10 text-red-200',
              )}
            >
              {REPORT_STATUS_LABELS[report.status]}
            </span>
          </div>
          {report.note ? <p className="mt-1 text-xs text-hero-text/70">{report.note}</p> : null}
          <p className="mt-1 text-xs text-hero-text/50">
            {report.reportedAt ? formatContactDateTime(report.reportedAt) : 'Fecha no disponible'}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function SalesCommercialStatusBadge({ status }: { status: SalesMemberCommercialStatus }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        status === 'high_impact' && 'border-gold/30 bg-gold/10 text-gold-light',
        status === 'good_progress' && 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
        status === 'in_motion' && 'border-white/15 bg-white/5 text-hero-text/75',
        status === 'needs_support' && 'border-amber-400/25 bg-amber-500/10 text-amber-100',
        status === 'no_activity' && 'border-white/10 bg-white/5 text-hero-text/55',
      )}
    >
      {SALES_COMMERCIAL_STATUS_LABELS[status]}
    </span>
  )
}
