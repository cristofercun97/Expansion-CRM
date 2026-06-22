import { Check, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import type { TeamSalesReport } from '@/features/sales-goals/types/sales-goal.types'
import { formatSalesCurrency, SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { formatContactDateTime } from '@/features/contacts/utils/formatContactDate'
import { cn } from '@/lib/utils'

type SalesReportsReviewSectionProps = {
  reports: TeamSalesReport[]
  processingReportId?: string | null
  onValidate: (reportId: string) => Promise<void>
  onReject: (reportId: string) => Promise<void>
  className?: string
}

const STATUS_LABELS = {
  reported: 'Pendiente',
  validated: 'Validada',
  rejected: 'Rechazada',
} as const

export function SalesReportsReviewSection({
  reports,
  processingReportId = null,
  onValidate,
  onReject,
  className,
}: SalesReportsReviewSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === 'reported'),
    [reports],
  )
  const visibleReports = useMemo(
    () =>
      [...reports]
        .sort((left, right) => {
          if (left.status === 'reported' && right.status !== 'reported') {
            return -1
          }

          if (right.status === 'reported' && left.status !== 'reported') {
            return 1
          }

          return 0
        })
        .slice(0, 8),
    [reports],
  )

  if (visibleReports.length === 0) {
    return null
  }

  return (
    <section className={cn('rounded-xl border border-white/10 bg-white/5 p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-hero-text">Ventas reportadas</h4>
          <p className="mt-1 text-xs text-hero-text/65">
            {pendingReports.length > 0
              ? SALES_GOAL_COPY.pendingSalesLeaderNotice
              : 'Valida las ventas del equipo para sumarlas al objetivo.'}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-teal-accent hover:text-teal-accent/80"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Ocultar' : 'Ver reportes'}
        </button>
      </div>

      {expanded ? (
        <ul className="mt-4 space-y-3">
          {visibleReports.map((report) => (
            <li
              key={report.id}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-hero-text">{report.memberName}</p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gold-light">
                    {formatSalesCurrency(report.amount, report.currency)}
                  </p>
                  {report.note ? (
                    <p className="mt-1 text-sm text-hero-text/70">{report.note}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-hero-text/50">
                    {report.reportedAt
                      ? formatContactDateTime(report.reportedAt)
                      : 'Fecha no disponible'}
                  </p>
                </div>

                {report.status === 'reported' ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-teal-accent text-petrol-deep hover:bg-teal-accent/90"
                      disabled={processingReportId === report.id}
                      onClick={() => void onValidate(report.id)}
                    >
                      {processingReportId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          Validar
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
                      disabled={processingReportId === report.id}
                      onClick={() => void onReject(report.id)}
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Rechazar
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function StatusBadge({ status }: { status: TeamSalesReport['status'] }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        status === 'reported' && 'border-gold/25 bg-gold/10 text-gold-light',
        status === 'validated' && 'border-teal-accent/25 bg-teal-accent/10 text-teal-accent',
        status === 'rejected' && 'border-red-400/25 bg-red-500/10 text-red-200',
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
