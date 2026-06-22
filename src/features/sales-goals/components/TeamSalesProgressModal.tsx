import { ChevronDown, ChevronUp, Mail, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { buildTeamFollowUpMailto } from '@/features/team-progress/utils/teamProgressUtils'
import type { TeamMember } from '@/features/team/types/team.types'
import { buildTeamCommercialProgressSummaries } from '@/features/sales-goals/utils/salesReportAnalytics'
import { formatSalesCurrency, SALES_GOAL_COPY } from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type TeamSalesProgressModalProps = {
  open: boolean
  goal: TeamSalesGoal | null
  reports: TeamSalesReport[]
  members: TeamMember[]
  onClose: () => void
}

function MemberProgressRow({
  summary,
  reports,
  goal,
}: {
  summary: SalesMemberCommercialSummary
  reports: TeamSalesReport[]
  goal: TeamSalesGoal | null
}) {
  const [expanded, setExpanded] = useState(false)
  const currency = goal?.currency ?? 'EUR'
  const contactMailto = buildTeamFollowUpMailto(summary.memberEmail ?? '')

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
          {summary.memberEmail ? (
            <p className="mt-0.5 truncate text-xs text-hero-text/60">{summary.memberEmail}</p>
          ) : null}
          <p className="mt-2 text-lg font-semibold text-gold-light">
            {formatSalesCurrency(summary.totalValidatedCurrentMonth, currency)}
          </p>
          <p className="text-xs text-hero-text/60">Validado este mes</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {contactMailto ? (
            <a
              href={contactMailto}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-accent/25 bg-teal-accent/10 px-3 py-1.5 text-xs font-medium text-teal-accent transition-colors hover:bg-teal-accent/15"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Acompañar
            </a>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/20 bg-transparent text-hero-text hover:bg-white/10"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? (
              <>
                Ocultar detalle
                <ChevronUp className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </>
            ) : (
              <>
                Ver detalle
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniMetric
          label="Validado total"
          value={formatSalesCurrency(summary.totalValidatedAllTime, currency)}
        />
        <MiniMetric label="Reportadas" value={String(summary.reportedCount)} />
        <MiniMetric label="Pendientes" value={String(summary.pendingCount)} accent="text-gold-light" />
        <MiniMetric label="Rechazadas" value={String(summary.rejectedCount)} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MiniMetric
          label="Pendiente por validar"
          value={formatSalesCurrency(summary.pendingAmount, currency)}
        />
        <MiniMetric
          label="Aporte al objetivo"
          value={goal ? `${summary.contributionPercentage}%` : '—'}
        />
      </div>

      {expanded ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <h5 className="text-sm font-semibold text-hero-text">Ventas del miembro</h5>
          <SalesMemberReportsList reports={memberReports} className="mt-3" />
        </div>
      ) : null}
    </article>
  )
}

export function TeamSalesProgressModal({
  open,
  goal,
  reports,
  members,
  onClose,
}: TeamSalesProgressModalProps) {
  const summaries = useMemo(
    () => buildTeamCommercialProgressSummaries(reports, goal, members),
    [goal, members, reports],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Cerrar progreso de ventas"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-sales-progress-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-petrol-deep shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-accent" aria-hidden="true" />
              <h2 id="team-sales-progress-title" className="text-xl font-semibold text-hero-text">
                {SALES_GOAL_COPY.teamSalesProgressModalTitle}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-hero-text/70">
              {SALES_GOAL_COPY.teamSalesProgressModalDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hero-text/70 transition-colors hover:bg-white/10 hover:text-hero-text"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {summaries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-hero-text/70">
              {SALES_GOAL_COPY.commercialReportEmpty}
            </p>
          ) : (
            <ul className="space-y-4">
              {summaries.map((summary) => (
                <li key={summary.memberUid}>
                  <MemberProgressRow summary={summary} reports={reports} goal={goal} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-white/10 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function MiniMetric({
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
