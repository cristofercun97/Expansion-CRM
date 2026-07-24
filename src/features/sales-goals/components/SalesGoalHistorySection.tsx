import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import { SalesGoalHistoryDetailModal } from '@/features/sales-goals/components/SalesGoalHistoryDetailModal'
import type { TeamSalesGoalHistory } from '@/features/sales-goals/types/sales-goal.types'
import {
  buildSalesPeriodKey,
  formatSalesCurrency,
  getPreviousSalesPeriodDate,
  SALES_GOAL_COPY,
} from '@/features/sales-goals/utils/salesGoalUtils'
import { cn } from '@/lib/utils'

type SalesGoalHistorySectionProps = {
  history: TeamSalesGoalHistory[]
  loading?: boolean
  className?: string
}

function formatClosedDate(history: TeamSalesGoalHistory): string {
  const timestamp = history.closedAt ?? history.createdAt

  if (!timestamp?.toDate) {
    if (history.id.startsWith('recognition_')) {
      return 'Desde reconocimientos'
    }

    if (history.id.startsWith('reports_')) {
      return 'Reconstruido desde ventas'
    }

    return 'Periodo cerrado'
  }

  return timestamp.toDate().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function outcomeLabel(entry: TeamSalesGoalHistory): string {
  if (entry.targetAmount <= 0) {
    return SALES_GOAL_COPY.historyNoOfficialGoal
  }

  return entry.outcome === 'achieved'
    ? SALES_GOAL_COPY.historyAchieved
    : SALES_GOAL_COPY.historyMissed
}

export function SalesGoalHistorySection({
  history,
  loading = false,
  className,
}: SalesGoalHistorySectionProps) {
  const [selectedEntry, setSelectedEntry] = useState<TeamSalesGoalHistory | null>(null)
  const previousMonthKey = useMemo(
    () => buildSalesPeriodKey('monthly', getPreviousSalesPeriodDate('monthly')).periodKey,
    [],
  )

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-white/10 bg-white/5 px-4 py-3', className)}>
        <p className="text-sm text-hero-text/60">Cargando historial…</p>
      </div>
    )
  }

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-semibold text-hero-text">{SALES_GOAL_COPY.historyTitle}</h3>
        <p className="mt-1 text-xs text-hero-text/60">
          Resultado de periodos anteriores: si se cumplió la meta y cuánto vendió cada persona.
        </p>
      </div>

      {history.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-hero-text/65">
          {SALES_GOAL_COPY.historyEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {history.map((entry, index) => {
            const achieved = entry.targetAmount > 0 && entry.outcome === 'achieved'
            const missed = entry.targetAmount > 0 && entry.outcome === 'missed'
            const periodKind = entry.periodType === 'monthly' ? 'Mensual' : 'Semanal'
            const isLatest = index === 0
            const isPreviousMonth = entry.periodKey === previousMonthKey
            const sellersWithSales = entry.memberBreakdown.filter(
              (member) => member.validatedAmount > 0,
            ).length

            return (
              <li
                key={entry.id}
                className={cn(
                  'rounded-xl border px-4 py-3',
                  isPreviousMonth || isLatest
                    ? 'border-gold/25 bg-gold/8'
                    : 'border-white/10 bg-white/5',
                )}
              >
                {isPreviousMonth ? (
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gold-light">
                    {SALES_GOAL_COPY.historyPreviousMonth}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hero-text">
                      {periodKind} · {entry.periodLabel}
                    </p>
                    <p className="mt-1 text-xs text-hero-text/60">
                      {entry.targetAmount > 0 ? (
                        <>
                          Meta {formatSalesCurrency(entry.targetAmount, entry.currency)} ·
                          Alcanzado {formatSalesCurrency(entry.finalAmount, entry.currency)}
                        </>
                      ) : (
                        <>
                          Ventas validadas{' '}
                          {formatSalesCurrency(entry.finalAmount, entry.currency)}
                        </>
                      )}
                      {' · '}
                      {formatClosedDate(entry)}
                    </p>
                    <p className="mt-1 text-xs text-hero-text/50">
                      {sellersWithSales} vendedor
                      {sellersWithSales === 1 ? '' : 'es'} con ventas validadas
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-medium',
                      achieved
                        ? 'bg-teal-accent/15 text-teal-accent'
                        : missed
                          ? 'bg-gold/15 text-gold-light'
                          : 'bg-white/10 text-hero-text/70',
                    )}
                  >
                    {outcomeLabel(entry)}
                  </span>
                </div>

                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 border-teal-accent/30 bg-teal-accent/10 text-teal-accent hover:bg-teal-accent/15',
                      isPreviousMonth && 'border-gold/30 bg-gold/10 text-gold-light hover:bg-gold/15',
                    )}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    {SALES_GOAL_COPY.historyDetailButton}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <SalesGoalHistoryDetailModal
        open={Boolean(selectedEntry)}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </section>
  )
}
